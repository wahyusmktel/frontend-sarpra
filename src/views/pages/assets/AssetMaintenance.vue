<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';

const toast = useToast();
const API_URL = 'http://localhost:8000/api';
const token = localStorage.getItem('token');

const maintenances = ref([]);
const assets = ref([]);
const maintenance = ref({});
const maintenanceDialog = ref(false);
const deleteDialog = ref(false);
const maintenanceToDelete = ref(null);
const submitted = ref(false);
const loading = ref(true);
const filteredAssets = ref([]);
const selectedAsset = ref(null);
const scanVisible = ref(false);
const dt = ref();

onMounted(() => {
    fetchData();
});

async function fetchData() {
    loading.value = true;
    try {
        const [maintRes, assetRes] = await Promise.all([axios.get(`${API_URL}/asset-maintenances`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API_URL}/assets`, { headers: { Authorization: `Bearer ${token}` } })]);
        maintenances.value = maintRes.data.data ?? maintRes.data;
        assets.value = assetRes.data.data ?? assetRes.data;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data' });
    } finally {
        loading.value = false;
    }
}

function openNew() {
    maintenance.value = { performed_at: new Date() };
    selectedAsset.value = null;
    submitted.value = false;
    maintenanceDialog.value = true;
}

function hideDialog() {
    maintenanceDialog.value = false;
    maintenance.value = {};
    selectedAsset.value = null;
    submitted.value = false;
}

function editMaintenance(data) {
    maintenance.value = { ...data };
    selectedAsset.value = data.asset;
    maintenanceDialog.value = true;
}

function confirmDelete(data) {
    maintenanceToDelete.value = data;
    deleteDialog.value = true;
}

async function deleteMaintenance() {
    try {
        await axios.delete(`${API_URL}/asset-maintenances/${maintenanceToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data dihapus' });
        fetchData();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal hapus data' });
    } finally {
        deleteDialog.value = false;
        maintenanceToDelete.value = null;
    }
}

async function saveMaintenance() {
    submitted.value = true;

    if (!maintenance.value.asset_id || !maintenance.value.maintenance_type || !maintenance.value.performed_at) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Harap lengkapi semua field wajib' });
        return;
    }

    try {
        if (maintenance.value.id) {
            await axios.put(`${API_URL}/asset-maintenances/${maintenance.value.id}`, maintenance.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data diperbarui' });
        } else {
            await axios.post(`${API_URL}/asset-maintenances`, maintenance.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data ditambahkan' });
        }
        hideDialog();
        fetchData();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal simpan data' });
    }
}

function searchAsset(event) {
    const query = event.query.toLowerCase();
    filteredAssets.value = assets.value.filter((a) => a.name.toLowerCase().includes(query));
}

function selectAsset(e) {
    maintenance.value.asset_id = e.value.id;
    selectedAsset.value = e.value;
}

async function handleScannedResult(url) {
    try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        selectedAsset.value = res.data;
        maintenance.value.asset_id = res.data.id;
        scanVisible.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'QR Gagal', detail: 'Data aset tidak ditemukan' });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Manajemen Perawatan Aset</h4>

        <template v-if="loading">
            <Skeleton width="100%" height="2rem" class="mb-2" v-for="i in 4" :key="i" />
        </template>

        <template v-else>
            <Toolbar class="mb-4">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export CSV" icon="pi pi-upload" severity="help" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="maintenances" dataKey="id" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 25]">
                <Column field="asset.name" header="Nama Aset" sortable></Column>
                <Column field="maintenance_type" header="Jenis Perawatan" sortable></Column>
                <Column field="performed_by" header="Teknisi" sortable></Column>
                <Column field="performed_at" header="Tanggal" sortable></Column>
                <Column header="Aksi">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" class="mr-2" @click="editMaintenance(slotProps.data)" outlined rounded />
                        <Button icon="pi pi-trash" severity="danger" @click="confirmDelete(slotProps.data)" outlined rounded />
                    </template>
                </Column>
            </DataTable>

            <Dialog v-model:visible="maintenanceDialog" header="Form Perawatan Aset" :modal="true" :style="{ width: '90vw' }">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Kolom Kiri -->
                    <div class="flex flex-col gap-4">
                        <label class="font-bold">Cari Aset</label>
                        <AutoComplete v-model="selectedAsset" :suggestions="filteredAssets" field="name" placeholder="Ketik nama aset..." class="w-full" @complete="searchAsset" @item-select="selectAsset" />
                        <div v-if="selectedAsset">
                            <div class="p-4 border rounded bg-gray-50">
                                <p><strong>Nama:</strong> {{ selectedAsset.name }}</p>
                                <p><strong>Serial:</strong> {{ selectedAsset.serial_number }}</p>
                                <p><strong>Kategori:</strong> {{ selectedAsset.category?.name }}</p>
                                <p><strong>Kondisi:</strong> {{ selectedAsset.condition?.name }}</p>
                                <p><strong>Lokasi:</strong> {{ selectedAsset.location?.name }}</p>
                                <img v-if="selectedAsset.qr_code_path" :src="`${API_URL.replace('/api', '')}/${selectedAsset.qr_code_path}`" alt="QR Code" class="mt-4 w-40 h-40 object-contain border" />
                            </div>
                        </div>
                        <Button label="Atau Scan QR Code" icon="pi pi-qrcode" @click="scanVisible = true" class="mt-3" />
                    </div>

                    <!-- Kolom Kanan -->
                    <div class="flex flex-col gap-4">
                        <InputText v-model="maintenance.maintenance_type" placeholder="Jenis Perawatan (Perbaikan, Pembersihan, dll)" class="w-full" />
                        <InputText v-model="maintenance.performed_by" placeholder="Dilakukan oleh" class="w-full" />
                        <InputNumber v-model="maintenance.cost" placeholder="Biaya (Opsional)" class="w-full" inputClass="w-full" />
                        <Calendar v-model="maintenance.performed_at" showTime hourFormat="24" placeholder="Tanggal Perawatan" class="w-full" />
                        <Textarea v-model="maintenance.description" placeholder="Deskripsi" rows="3" class="w-full" />
                    </div>
                </div>

                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Simpan" icon="pi pi-check" @click="saveMaintenance" />
                </template>
            </Dialog>

            <!-- Dialog Hapus -->
            <Dialog v-model:visible="deleteDialog" header="Konfirmasi Hapus" :modal="true" :style="{ width: '450px' }">
                <div class="flex items-center gap-4">
                    <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                    <span v-if="maintenanceToDelete"
                        >Yakin ingin menghapus <b>{{ maintenanceToDelete.asset?.name }}</b
                        >?</span
                    >
                </div>
                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteMaintenance" />
                </template>
            </Dialog>

            <!-- Dialog Scan QR -->
            <Dialog v-model:visible="scanVisible" header="Scan QR Code Aset" :modal="true" :style="{ width: '450px' }">
                <QrcodeStream @detect="([code]) => handleScannedResult(code.rawValue)" />
            </Dialog>
        </template>
    </div>
</template>
