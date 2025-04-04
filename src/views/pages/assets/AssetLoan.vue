<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

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

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const statuses = ['Dipinjam', 'Dikembalikan', 'Terlambat'];

onMounted(async () => {
    await fetchData();
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

function openNew() {
    loan.value = {};
    submitted.value = false;
    loanDialog.value = true;
}

function hideDialog() {
    loanDialog.value = false;
    submitted.value = false;
    loan.value = {};
}

function editLoan(data) {
    loan.value = { ...data };
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

async function saveLoan() {
    submitted.value = true;
    if (!loan.value.asset_id || !loan.value.borrower_user_id || !loan.value.loan_start || !loan.value.loan_end || !loan.value.status) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Harap lengkapi semua field yang wajib' });
        return;
    }

    try {
        if (loan.value.id) {
            await axios.put(`${API_URL}/asset-loans/${loan.value.id}`, loan.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Peminjaman diperbarui' });
        } else {
            await axios.post(`${API_URL}/asset-loans`, loan.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
        await axios.delete(`${API_URL}/asset-loans/${loanToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
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

        await Promise.all(
            ids.map((id) =>
                axios.delete(`${API_URL}/asset-loans/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            )
        );

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
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded outlined class="mr-2" @click="editLoan(slotProps.data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteLoan(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

            <Dialog v-model:visible="loanDialog" :style="{ width: '450px' }" header="Form Peminjaman Aset" :modal="true">
                <div class="flex flex-col gap-4">
                    <Dropdown v-model="loan.asset_id" :options="assets" optionLabel="name" optionValue="id" placeholder="Pilih Aset" class="w-full" />
                    <Dropdown v-model="loan.borrower_user_id" :options="users" optionLabel="username" optionValue="id" placeholder="Pilih Peminjam" class="w-full" />
                    <Textarea v-model="loan.purpose" placeholder="Keperluan" class="w-full" rows="3" />
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Calendar v-model="loan.loan_start" placeholder="Tanggal Pinjam" class="w-full" />
                        <Calendar v-model="loan.loan_end" placeholder="Tanggal Kembali" class="w-full" />
                    </div>
                    <Dropdown v-model="loan.status" :options="statuses" placeholder="Status" class="w-full" />
                    <Textarea v-model="loan.notes" placeholder="Catatan" class="w-full" rows="3" />
                </div>

                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Simpan" icon="pi pi-check" @click="saveLoan" />
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
        </template>
    </div>
</template>
