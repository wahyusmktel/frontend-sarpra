<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();

const loading = ref(true);
const assets = ref([]);
const asset = ref({});
const selectedAssets = ref();
const assetDialog = ref(false);
const deleteAssetDialog = ref(false);
const deleteAssetsDialog = ref(false);
const submitted = ref(false);
const categories = ref([]);
const conditions = ref([]);
const locations = ref([]);
const types = ref([]);
const users = ref([]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const token = localStorage.getItem('token');
const API_URL = 'http://localhost:8000/api/assets';

onMounted(async () => {
    loading.value = true;
    await Promise.all([fetchAssets(), fetchCategories(), fetchConditions(), fetchLocations(), fetchTypes(), fetchUsers()]);
    loading.value = false;
});

async function fetchAssets() {
    try {
        const res = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        assets.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Error fetch assets:', err);
    }
}

async function fetchCategories() {
    try {
        const res = await axios.get('http://localhost:8000/api/asset-categories', {
            headers: { Authorization: `Bearer ${token}` }
        });
        categories.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil kategori:', err);
    }
}

async function fetchConditions() {
    try {
        const res = await axios.get('http://localhost:8000/api/asset-conditions', {
            headers: { Authorization: `Bearer ${token}` }
        });
        conditions.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil kondisi aset:', err);
    }
}

async function fetchLocations() {
    try {
        const res = await axios.get('http://localhost:8000/api/asset-locations', {
            headers: { Authorization: `Bearer ${token}` }
        });
        locations.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil lokasi aset:', err);
    }
}

async function fetchTypes() {
    try {
        const res = await axios.get('http://localhost:8000/api/asset-types', {
            headers: { Authorization: `Bearer ${token}` }
        });
        types.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil jenis aset:', err);
    }
}

async function fetchUsers() {
    try {
        const res = await axios.get('http://localhost:8000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        users.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil daftar user:', err);
    }
}

function openNew() {
    asset.value = {};
    submitted.value = false;
    assetDialog.value = true;
}

function hideDialog() {
    assetDialog.value = false;
    submitted.value = false;
}

function confirmDeleteAsset(data) {
    asset.value = data;
    deleteAssetDialog.value = true;
}

function confirmDeleteSelected() {
    deleteAssetsDialog.value = true;
}

async function saveAsset() {
    submitted.value = true;
    if (!asset.value.name) return;

    try {
        if (asset.value.id) {
            await axios.put(`${API_URL}/${asset.value.id}`, asset.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Aset diperbarui', life: 3000 });
        } else {
            await axios.post(API_URL, asset.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Aset ditambahkan', life: 3000 });
        }

        fetchAssets();
        assetDialog.value = false;
        asset.value = {};
    } catch (error) {
        console.error('Save error:', error);
    }
}

async function deleteAsset() {
    try {
        await axios.delete(`${API_URL}/${asset.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchAssets();
        deleteAssetDialog.value = false;
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Aset berhasil dihapus', life: 3000 });
    } catch (error) {
        console.error('Delete error:', error);
    }
}

function editAsset(data) {
    asset.value = { ...data };
    assetDialog.value = true;
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <!-- Skeleton Loader -->
        <template v-if="loading">
            <div class="mb-5">
                <Skeleton height="2rem" class="mb-2" v-for="n in 5" :key="n" />
            </div>
        </template>
        <template v-else>
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" class="mr-2" @click="openNew" />
                    <Button label="Hapus" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedAssets?.length" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedAssets"
                :value="assets"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assets"
            >
                <template #header>
                    <div class="flex justify-between items-center">
                        <h4 class="m-0">Manajemen Aset</h4>
                        <InputText v-model="filters['global'].value" placeholder="Cari aset..." />
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" />
                <Column field="name" header="Nama" sortable />
                <Column field="serial_number" header="Serial" sortable />
                <Column field="category.name" header="Kategori" />
                <Column field="condition.name" header="Kondisi" />
                <Column field="location.name" header="Lokasi" />
                <Column field="acquisition_date" header="Tgl. Perolehan" />
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded outlined class="mr-2" @click="editAsset(slotProps.data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteAsset(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>
        <!-- Dialog Form -->
        <Dialog v-model:visible="assetDialog" :style="{ width: '450px' }" header="Form Manajemen Aset" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-3">Nama Aset</label>
                    <InputText id="name" v-model.trim="asset.name" required="true" autofocus :invalid="submitted && !asset.name" fluid />
                    <small v-if="submitted && !asset.name" class="text-red-500">Nama Aset is required.</small>
                </div>
                <div>
                    <label for="serial_number" class="block font-bold mb-3">Serial Number</label>
                    <InputText id="serial_number" v-model.trim="asset.serial_number" required="true" :invalid="submitted && !asset.serial_number" fluid />
                    <small v-if="submitted && !asset.serial_number" class="text-red-500">Serial Number is required.</small>
                </div>
                <div>
                    <label for="asset_code" class="block font-bold mb-3">Kode Aset</label>
                    <InputText id="asset_code" v-model="asset.asset_code" placeholder="Contoh: AST-2024-001" required :invalid="submitted && !asset.asset_code" class="w-full" />
                    <small v-if="submitted && !asset.asset_code" class="text-red-500">Kode aset wajib diisi.</small>
                </div>
                <div>
                    <label for="type_id" class="block font-bold mb-3">Jenis Aset</label>
                    <Dropdown id="type_id" v-model="asset.type_id" :options="types" optionLabel="name" optionValue="id" placeholder="Pilih Jenis Aset" class="w-full" />
                    <small v-if="submitted && !asset.type_id" class="text-red-500">Jenis aset wajib diisi.</small>
                </div>
                <div>
                    <label for="category" class="block font-bold mb-3">Kategori</label>
                    <Dropdown id="category" v-model="asset.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="Pilih Kategori" required :invalid="submitted && !asset.category_id" class="w-full" />
                    <small v-if="submitted && !asset.category_id" class="text-red-500">Kategori wajib diisi.</small>
                </div>
                <div>
                    <label for="location" class="block font-bold mb-3">Lokasi</label>
                    <Dropdown id="location" v-model="asset.location_id" :options="locations" optionLabel="name" optionValue="id" placeholder="Pilih Lokasi" required :invalid="submitted && !asset.location_id" class="w-full" />
                    <small v-if="submitted && !asset.location_id" class="text-red-500">Lokasi wajib diisi.</small>
                </div>
                <div>
                    <label for="acquisition_cost" class="block font-bold mb-3">Biaya Perolehan</label>
                    <InputNumber id="acquisition_cost" v-model="asset.acquisition_cost" mode="currency" currency="IDR" locale="id-ID" placeholder="Rp 0" class="w-full" />
                    <small v-if="submitted && !asset.acquisition_cost" class="text-red-500">Biaya Perolehan is required.</small>
                </div>
                <div>
                    <label for="funding_source" class="block font-bold mb-3">Sumber Dana</label>
                    <InputText id="funding_source" v-model="asset.funding_source" placeholder="Contoh: BOS, APBD, CSR" class="w-full" />
                    <small v-if="submitted && !asset.funding_source" class="text-red-500">Sumber Dana is required.</small>
                </div>
                <div>
                    <label for="acquisition_date" class="block font-bold mb-3">Tanggal Perolehan</label>
                    <Calendar id="acquisition_date" v-model="asset.acquisition_date" dateFormat="yy-mm-dd" required="true" :invalid="submitted && !asset.acquisition_date" fluid />
                    <small v-if="submitted && !asset.acquisition_date" class="text-red-500">Tanggal Perolehan is required.</small>
                </div>
                <div>
                    <label for="condition" class="block font-bold mb-3">Kondisi</label>
                    <Dropdown id="condition" v-model="asset.condition_id" :options="conditions" optionLabel="name" optionValue="id" placeholder="Pilih Kondisi" required :invalid="submitted && !asset.condition_id" class="w-full" />
                    <small v-if="submitted && !asset.condition_id" class="text-red-500">Kondisi wajib diisi.</small>
                </div>
                <div>
                    <label for="responsible_user_id" class="block font-bold mb-3">Penanggung Jawab</label>
                    <Dropdown id="responsible_user_id" v-model="asset.responsible_user_id" :options="users" optionLabel="username" optionValue="id" placeholder="Pilih Penanggung Jawab" class="w-full" />
                    <small v-if="submitted && !asset.responsible_user_id" class="text-red-500">Penanggung Jawab is required.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveAsset" />
            </template>
        </Dialog>

        <!-- Dialog Konfirmasi Hapus -->
        <Dialog v-model:visible="deleteAssetDialog" header="Konfirmasi" :style="{ width: '450px' }" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                <span
                    >Yakin ingin hapus <b>{{ asset.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteAssetDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteAsset" />
            </template>
        </Dialog>
    </div>
</template>
