<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';

const toast = useToast();
const API_URL = 'http://localhost:8000/api';
const token = localStorage.getItem('token');

const loans = ref([]);
const assets = ref([]);
const users = ref([]);
const loan = ref({});
const loanDialog = ref(false);
const deleteLoanDialog = ref(false);
const deleteLoansDialog = ref(false);
const loanToDelete = ref(null);
const selectedLoans = ref([]);
const submitted = ref(false);
const loading = ref(true);
const selectedAsset = ref(null);
const filteredAssets = ref([]);
const scanVisible = ref(false); // Modal scan QR
const loanDuration = ref(null);

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS }, status: { value: null, matchMode: FilterMatchMode.EQUALS } });

const statuses = ['Dipinjam', 'Dikembalikan', 'Terlambat'];

onMounted(async () => {
    await fetchData();
});

watch([() => loan.value.loan_start, loanDuration], ([start, days]) => {
    if (start && days) {
        const newDate = new Date(start);
        newDate.setDate(newDate.getDate() + parseInt(days));
        loan.value.loan_end = newDate.toISOString().substring(0, 10); // ISO format
    }
});

async function fetchData() {
    loading.value = true;
    try {
        const [loanRes, assetRes, userRes] = await Promise.all([
            axios.get(`${API_URL}/asset-loans`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/assets`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        loans.value = loanRes.data.data ?? loanRes.data;
        assets.value = assetRes.data.data ?? assetRes.data;
        users.value = userRes.data.data ?? userRes.data;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data' });
    } finally {
        loading.value = false;
    }
}

// dari hasil QR code scanner
async function handleScannedResult(url) {
    try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        selectedAsset.value = res.data;
        loan.value.asset_id = res.data.id;
        scanVisible.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'QR tidak valid' });
    }
}

function printDocument(loan) {
    if (!loan.document_path) {
        toast.add({ severity: 'warn', summary: 'Tidak Ada Dokumen', detail: 'Dokumen belum tersedia' });
        return;
    }

    // const url = `${window.location.origin}/${loan.document_path}`;
    const url = `${API_URL.replace('/api', '')}/${loan.document_path}`;
    window.open(url, '_blank');
}

function onDetectQR([result]) {
    const url = result.rawValue;
    if (url) {
        handleScannedResult(url); // fungsi ini sudah kamu buat
    }
}

function onScanError() {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak bisa membaca QR code' });
}

function searchAsset(event) {
    const query = event.query.toLowerCase();
    filteredAssets.value = assets.value.filter((a) => a.name.toLowerCase().includes(query));
}

function selectAsset(e) {
    loan.value.asset_id = e.value.id;
    selectedAsset.value = e.value;
}

function openNew() {
    loan.value = {};
    selectedAsset.value = null;
    submitted.value = false;
    loanDialog.value = true;
    loanDuration.value = null;
}

function hideDialog() {
    loanDialog.value = false;
    submitted.value = false;
    loan.value = {};
    selectedAsset.value = null;
}

function editLoan(data) {
    loan.value = {
        ...data,
        loan_start: data.loan_start ? new Date(data.loan_start) : null,
        loan_end: data.loan_end ? new Date(data.loan_end) : null
    };
    selectedAsset.value = assets.value.find((asset) => asset.id === data.asset_id) || null; // Cari aset yang sesuai dengan asset_id
    loanDialog.value = true;
}

function confirmDeleteLoan(data) {
    loanToDelete.value = data;
    deleteLoanDialog.value = true;
}

function confirmDeleteSelected() {
    deleteLoansDialog.value = true;
}

function getStatusSeverity(status) {
    switch (status) {
        case 'Dipinjam':
            return 'info';
        case 'Dikembalikan':
            return 'success';
        case 'Terlambat':
            return 'danger';
        default:
            return 'secondary';
    }
}

async function saveLoanWithAsset() {
    submitted.value = true;
    if (!loan.value.asset_id || !loan.value.borrower_user_id || !loan.value.loan_start || !loan.value.loan_end || !loan.value.status) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Harap lengkapi semua field yang wajib' });
        return;
    }

    try {
        let response;
        if (loan.value.id) {
            // Kirim permintaan PUT untuk memperbarui data
            response = await axios.put(`${API_URL}/asset-loans/${loan.value.id}`, loan.value, { headers: { Authorization: `Bearer ${token}` } });
        } else {
            // Kirim permintaan POST untuk menambahkan data baru
            response = await axios.post(`${API_URL}/asset-loans`, loan.value, { headers: { Authorization: `Bearer ${token}` } });
        }

        // Periksa respons dari backend
        if (response.data.message === 'Tidak ada perubahan data') {
            toast.add({ severity: 'info', summary: 'Info', detail: 'Tidak ada perubahan data' });
        } else if (response.data.message === 'Peminjaman diperbarui') {
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Peminjaman diperbarui' });
        } else if (response.data.message === 'Peminjaman ditambahkan') {
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Peminjaman ditambahkan' });
        }

        loanDialog.value = false;
        loan.value = {};
        await fetchData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal simpan data' });
    }
}

async function deleteLoan() {
    if (!loanToDelete.value) return;
    try {
        await axios.delete(`${API_URL}/asset-loans/${loanToDelete.value.id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Peminjaman dihapus' });
        await fetchData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data' });
    } finally {
        deleteLoanDialog.value = false;
        loanToDelete.value = null;
    }
}

async function deleteSelectedLoans() {
    try {
        const ids = selectedLoans.value.map((loan) => loan.id);

        await Promise.all(ids.map((id) => axios.delete(`${API_URL}/asset-loans/${id}`, { headers: { Authorization: `Bearer ${token}` } })));

        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Peminjaman terpilih dihapus' });
        selectedLoans.value = [];
        await fetchData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus beberapa data' });
    } finally {
        deleteLoansDialog.value = false;
    }
}

const dt = ref();
function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Manajemen Peminjaman Aset</h4>

        <template v-if="loading">
            <Skeleton width="100%" height="2rem" class="mb-2" v-for="i in 4" :key="i" />
        </template>

        <template v-else>
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" @click="openNew" />
                    <Button label="Hapus" icon="pi pi-trash" severity="danger" :disabled="!selectedLoans.length" @click="confirmDeleteSelected" />
                </template>
                <template #end>
                    <div class="flex items-center gap-2">
                        <Dropdown v-model="filters.status.value" :options="statuses" placeholder="Filter Status" class="w-48" />
                        <Button label="Export CSV" icon="pi pi-upload" severity="help" @click="exportCSV" />
                    </div>
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                :value="loans"
                :paginator="true"
                :rows="10"
                v-model:selection="selectedLoans"
                selectionMode="multiple"
                dataKey="id"
                :filters="filters"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} data"
            >
                <template #header>
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-bold">Daftar Peminjaman</span>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" />
                <Column field="asset.name" header="Nama Aset" sortable></Column>
                <Column field="borrower.username" header="Peminjam" sortable></Column>
                <Column header="Tgl Pinjam" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.loan_start).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
                <Column header="Tgl Kembali" sortable>
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.loan_end).toLocaleDateString('id-ID') }}
                    </template>
                </Column>
                <Column header="Status" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column header="Dokumen">
                    <template #body="slotProps">
                        <a v-if="slotProps.data.document_path" :href="`${API_URL.replace('/api', '')}/${slotProps.data.document_path}`" target="_blank">
                            {{ slotProps.data.document_name }}
                        </a>
                        <span v-else class="text-gray-400 italic">Belum tersedia</span>
                    </template>
                </Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded outlined class="mr-2" @click="editLoan(slotProps.data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteLoan(slotProps.data)" />
                        <Button v-if="slotProps.data.document_name" icon="pi pi-print" rounded outlined severity="success" @click="printDocument(slotProps.data)" v-tooltip="'Cetak Surat Peminjaman'" />
                    </template>
                </Column>
            </DataTable>

            <Dialog v-model:visible="loanDialog" :style="{ width: '90vw' }" header="Form Peminjaman Aset" :modal="true">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Kolom Kiri -->
                    <div class="flex flex-col gap-4">
                        <label class="font-bold">Cari Aset</label>
                        <AutoComplete v-model="selectedAsset" :suggestions="filteredAssets" field="name" optionLabel="name" placeholder="Ketik nama aset..." class="w-full" @complete="searchAsset" @item-select="selectAsset">
                            <template #item="slotProps">
                                <div class="flex flex-col">
                                    <span class="font-semibold">{{ slotProps.item.name }}</span>
                                    <small class="text-gray-500">Serial: {{ slotProps.item.serial_number }}</small>
                                </div>
                            </template>
                        </AutoComplete>

                        <div v-if="selectedAsset">
                            <div class="p-4 border rounded bg-gray-50">
                                <p class="mb-1"><i class="pi pi-tag mr-2" /> <strong>Nama:</strong> {{ selectedAsset.name }}</p>
                                <p class="mb-1"><i class="pi pi-hashtag mr-2" /> <strong>Serial:</strong> {{ selectedAsset.serial_number }}</p>
                                <p class="mb-1"><i class="pi pi-list mr-2" /> <strong>Kategori:</strong> {{ selectedAsset.category?.name }}</p>
                                <p class="mb-1"><i class="pi pi-check-circle mr-2" /> <strong>Kondisi:</strong> {{ selectedAsset.condition?.name }}</p>
                                <p class="mb-1"><i class="pi pi-map-marker mr-2" /> <strong>Lokasi:</strong> {{ selectedAsset.location?.name }}</p>
                                <img v-if="selectedAsset.qr_code_path" :src="`${API_URL.replace('/api', '')}/${selectedAsset.qr_code_path}`" alt="QR Code" class="mt-4 w-40 h-40 object-contain border" />
                            </div>
                        </div>

                        <div>
                            <Button label="Atau Scan QR Code" icon="pi pi-qrcode" class="mt-2" @click="scanVisible = true" />
                        </div>
                    </div>

                    <!-- Kolom Kanan -->
                    <div class="flex flex-col gap-4">
                        <Dropdown v-model="loan.borrower_user_id" :options="users" optionLabel="username" optionValue="id" placeholder="Pilih Peminjam" class="w-full" />
                        <Textarea v-model="loan.purpose" placeholder="Keperluan" class="w-full" rows="3" />
                        <InputNumber v-model="loanDuration" placeholder="Lama Peminjaman (hari)" class="w-full" :min="1" />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Calendar v-model="loan.loan_start" placeholder="Tanggal Pinjam" class="w-full" />
                            <Calendar v-model="loan.loan_end" placeholder="Tanggal Kembali" class="w-full" :readonlyInput="true" :disabled="true" />
                        </div>
                        <Dropdown v-model="loan.status" :options="statuses" placeholder="Status" class="w-full" />
                        <Textarea v-model="loan.notes" placeholder="Catatan" class="w-full" rows="3" />
                    </div>
                </div>

                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Simpan" icon="pi pi-check" @click="saveLoanWithAsset" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deleteLoanDialog" header="Konfirmasi Hapus" :style="{ width: '450px' }" :modal="true">
                <div class="flex items-center gap-4">
                    <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                    <span v-if="loanToDelete">
                        Yakin ingin menghapus <b>{{ loanToDelete.asset?.name }}</b
                        >?
                    </span>
                </div>
                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="deleteLoanDialog.value = false" />
                    <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteLoan" />
                </template>
            </Dialog>
            <Dialog v-model:visible="deleteLoansDialog" header="Konfirmasi Hapus Beberapa" :style="{ width: '450px' }" :modal="true">
                <div class="flex items-center gap-4">
                    <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                    <span
                        >Yakin ingin menghapus <b>{{ selectedLoans.length }}</b> peminjaman terpilih?</span
                    >
                </div>
                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="deleteLoansDialog.value = false" />
                    <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteSelectedLoans" />
                </template>
            </Dialog>
            <!-- Modal QR Code Scanner -->
            <Dialog v-model:visible="scanVisible" header="Scan QR Code Aset" :style="{ width: '600px' }" :modal="true">
                <QrcodeStream @detect="onDetectQR" @error="onScanError" />
                <template #footer>
                    <Button label="Tutup" icon="pi pi-times" text @click="scanVisible = false" />
                </template>
            </Dialog>
        </template>
    </div>
</template>
