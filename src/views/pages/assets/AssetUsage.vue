<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';

const toast = useToast();
const API_URL = 'http://localhost:8000/api';
const token = localStorage.getItem('token');

const usages = ref([]);
const assets = ref([]);
const users = ref([]);
const usage = ref({});
const selectedAsset = ref(null);
const usageDialog = ref(false);
const deleteDialog = ref(false);
const usageToDelete = ref(null);
const loading = ref(true);
const submitted = ref(false);
const dt = ref();
const scanVisible = ref(false);
const filteredAssets = ref([]);
const photoFile = ref(null);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const conditionOptions = ['Baik', 'Rusak', 'Perlu Perawatan'];

onMounted(fetchData);

async function fetchData() {
    loading.value = true;
    try {
        const [usageRes, assetRes, userRes] = await Promise.all([
            axios.get(`${API_URL}/asset-usages`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/assets`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        usages.value = usageRes.data.data ?? usageRes.data;
        assets.value = assetRes.data.data ?? assetRes.data;
        users.value = userRes.data.data ?? userRes.data;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Gagal memuat data' });
    } finally {
        loading.value = false;
    }
}

function formatDateTime(date) {
    if (!date) return null;
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function openNew() {
    usage.value = {
        used_at: new Date()
    };
    selectedAsset.value = null;
    photoFile.value = null;
    submitted.value = false;
    usageDialog.value = true;
}

function editUsage(data) {
    usage.value = { ...data };
    selectedAsset.value = data.asset;
    usageDialog.value = true;
}

function hideDialog() {
    usageDialog.value = false;
    usage.value = {};
    selectedAsset.value = null;
    photoFile.value = null;
}

function confirmDelete(data) {
    usageToDelete.value = data;
    deleteDialog.value = true;
}

async function deleteUsage() {
    try {
        await axios.delete(`${API_URL}/asset-usages/${usageToDelete.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Penggunaan aset dihapus' });
        fetchData();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus data' });
    } finally {
        deleteDialog.value = false;
        usageToDelete.value = null;
    }
}

function searchAsset(event) {
    const query = event.query.toLowerCase();
    filteredAssets.value = assets.value.filter((a) => a.name.toLowerCase().includes(query));
}

function selectAsset(e) {
    usage.value.asset_id = e.value.id;
    selectedAsset.value = e.value;
}

async function handleScannedResult(url) {
    try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        selectedAsset.value = res.data;
        usage.value.asset_id = res.data.id;
        scanVisible.value = false;
    } catch {
        toast.add({ severity: 'error', summary: 'QR Tidak Valid', detail: 'QR Code tidak cocok' });
    }
}

function onFileChange(e) {
    photoFile.value = e.target.files[0];
}

async function saveUsage() {
    submitted.value = true;

    if (!usage.value.asset_id || !usage.value.user_id || !usage.value.usage_type) {
        toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Harap lengkapi data wajib' });
        return;
    }

    const formData = new FormData();

    // Format tanggal yang bisa dibaca Laravel
    formData.append('asset_id', usage.value.asset_id);
    formData.append('user_id', usage.value.user_id);
    formData.append('usage_type', usage.value.usage_type || '');
    formData.append('description', usage.value.description || '');
    formData.append('used_at', formatDateTime(usage.value.used_at));
    formData.append('finished_at', formatDateTime(usage.value.finished_at));
    formData.append('condition_after', usage.value.condition_after || '');

    // Tambahkan file foto jika ada
    if (photoFile.value) {
        formData.append('photo', photoFile.value);
    }

    try {
        if (usage.value.id) {
            await axios.post(`${API_URL}/asset-usages/${usage.value.id}?_method=PUT`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data diperbarui' });
        } else {
            await axios.post(`${API_URL}/asset-usages`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Data ditambahkan' });
        }

        hideDialog();
        fetchData();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal simpan data' });
        console.error(error);
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Manajemen Penggunaan Aset</h4>

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

            <DataTable ref="dt" :value="usages" dataKey="id" :paginator="true" :rows="10" :filters="filters" :rowsPerPageOptions="[5, 10, 25]">
                <Column field="asset.name" header="Aset" sortable />
                <Column field="user.username" header="Pengguna" sortable />
                <Column field="usage_type" header="Jenis" />
                <Column field="used_at" header="Mulai" />
                <Column field="finished_at" header="Selesai" />
                <Column field="condition_after" header="Kondisi Akhir" />
                <Column header="Foto">
                    <template #body="slotProps">
                        <img v-if="slotProps.data.photo" :src="`${API_URL.replace('/api', '')}/storage/${slotProps.data.photo}`" alt="foto" class="w-12 h-12 object-cover border rounded" />
                    </template>
                </Column>
                <Column>
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" class="mr-2" @click="editUsage(slotProps.data)" outlined rounded />
                        <Button icon="pi pi-trash" severity="danger" @click="confirmDelete(slotProps.data)" outlined rounded />
                    </template>
                </Column>
            </DataTable>

            <!-- Modal -->
            <Dialog v-model:visible="usageDialog" header="Form Penggunaan Aset" :modal="true" :style="{ width: '90vw' }">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Kiri -->
                    <div class="flex flex-col gap-4">
                        <label class="font-bold">Cari Aset</label>
                        <AutoComplete v-model="selectedAsset" :suggestions="filteredAssets" field="name" optionLabel="name" class="w-full" placeholder="Ketik nama aset..." @complete="searchAsset" @item-select="selectAsset" />

                        <div v-if="selectedAsset" class="p-4 bg-gray-50 border rounded">
                            <p><strong>Nama:</strong> {{ selectedAsset.name }}</p>
                            <p><strong>Serial:</strong> {{ selectedAsset.serial_number }}</p>
                            <p><strong>Lokasi:</strong> {{ selectedAsset.location?.name }}</p>
                            <img v-if="selectedAsset.qr_code_path" :src="`${API_URL.replace('/api', '')}/${selectedAsset.qr_code_path}`" class="w-32 mt-2" />
                        </div>

                        <Button label="Atau Scan QR Code" icon="pi pi-qrcode" class="mt-2" @click="scanVisible = true" />
                    </div>

                    <!-- Kanan -->
                    <div class="flex flex-col gap-4">
                        <Dropdown v-model="usage.user_id" :options="users" optionLabel="username" optionValue="id" placeholder="Pilih Pengguna" class="w-full" />
                        <InputText v-model="usage.usage_type" placeholder="Jenis Penggunaan" class="w-full" />
                        <Textarea v-model="usage.description" placeholder="Deskripsi" class="w-full" />
                        <Calendar v-model="usage.used_at" showTime hourFormat="24" placeholder="Waktu Mulai" class="w-full" />
                        <Calendar v-model="usage.finished_at" showTime hourFormat="24" placeholder="Waktu Selesai" class="w-full" />
                        <Dropdown v-model="usage.condition_after" :options="conditionOptions" placeholder="Kondisi Akhir" class="w-full" />
                        <input type="file" accept="image/*" class="p-inputtext" @change="onFileChange" />
                    </div>
                </div>

                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Simpan" icon="pi pi-check" @click="saveUsage" />
                </template>
            </Dialog>

            <!-- Dialog QR Scanner -->
            <Dialog v-model:visible="scanVisible" header="Scan QR Aset" :modal="true" :style="{ width: '500px' }">
                <QrcodeStream @detect="([result]) => handleScannedResult(result.rawValue)" />
            </Dialog>

            <!-- Dialog Hapus -->
            <Dialog v-model:visible="deleteDialog" header="Konfirmasi Hapus" :modal="true" :style="{ width: '450px' }">
                <div class="flex items-center gap-3">
                    <i class="pi pi-exclamation-triangle text-red-500 text-xl" />
                    <span v-if="usageToDelete"
                        >Yakin ingin menghapus penggunaan aset <b>{{ usageToDelete.asset?.name }}</b
                        >?</span
                    >
                </div>
                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="deleteDialog = false" />
                    <Button label="Ya, Hapus" icon="pi pi-check" severity="danger" @click="deleteUsage" />
                </template>
            </Dialog>
        </template>
    </div>
</template>
