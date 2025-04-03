<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const loading = ref(true);

const API_URL = 'http://localhost:8000/api/asset-locations';
const token = localStorage.getItem('token');

const locations = ref([]);
const selectedLocations = ref();
const locationDialog = ref(false);
const deleteLocationDialog = ref(false);
const submitted = ref(false);
const location = ref({});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    await fetchLocations();
    loading.value = false;
});

async function fetchLocations() {
    try {
        const res = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        locations.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Error fetch locations:', err);
    }
}

function openNew() {
    location.value = {};
    submitted.value = false;
    locationDialog.value = true;
}

function editLocation(data) {
    location.value = { ...data };
    locationDialog.value = true;
}

function hideDialog() {
    locationDialog.value = false;
    submitted.value = false;
}

async function saveLocation() {
    submitted.value = true;
    if (!location.value.name) return;

    try {
        if (location.value.id) {
            await axios.put(`${API_URL}/${location.value.id}`, location.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Lokasi diperbarui', life: 3000 });
        } else {
            await axios.post(API_URL, location.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Lokasi ditambahkan', life: 3000 });
        }

        fetchLocations();
        locationDialog.value = false;
        location.value = {};
    } catch (error) {
        console.error('Save error:', error);
    }
}

function confirmDeleteLocation(data) {
    location.value = data;
    deleteLocationDialog.value = true;
}

async function deleteLocation() {
    try {
        await axios.delete(`${API_URL}/${location.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchLocations();
        deleteLocationDialog.value = false;
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Lokasi berhasil dihapus', life: 3000 });
    } catch (error) {
        console.error('Delete error:', error);
    }
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <template v-if="loading">
            <Skeleton class="mb-2" height="2rem" v-for="n in 5" :key="n" />
        </template>
        <template v-else>
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" class="mr-2" @click="openNew" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedLocations"
                :value="locations"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Menampilkan {first} hingga {last} dari {totalRecords} lokasi"
            >
                <template #header>
                    <div class="flex justify-between items-center">
                        <h4 class="m-0">Manajemen Lokasi Aset</h4>
                        <InputText v-model="filters['global'].value" placeholder="Cari lokasi..." />
                    </div>
                </template>

                <Column field="name" header="Nama Lokasi" sortable />
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editLocation(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteLocation(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

            <!-- Dialog Tambah/Edit -->
            <Dialog v-model:visible="locationDialog" :style="{ width: '450px' }" header="Form Lokasi Aset" :modal="true">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="name" class="block font-bold mb-2">Nama Lokasi</label>
                        <InputText id="name" v-model="location.name" autofocus :invalid="submitted && !location.name" class="w-full" />
                        <small v-if="submitted && !location.name" class="text-red-500">Nama lokasi wajib diisi.</small>
                    </div>
                </div>
                <template #footer>
                    <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Simpan" icon="pi pi-check" @click="saveLocation" />
                </template>
            </Dialog>

            <!-- Dialog Hapus -->
            <Dialog v-model:visible="deleteLocationDialog" header="Konfirmasi" :style="{ width: '450px' }" :modal="true">
                <div class="flex items-center gap-3">
                    <i class="pi pi-exclamation-triangle text-red-500 text-xl" />
                    <span
                        >Yakin ingin menghapus <b>{{ location.name }}</b
                        >?</span
                    >
                </div>
                <template #footer>
                    <Button label="Tidak" icon="pi pi-times" text @click="deleteLocationDialog = false" />
                    <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteLocation" />
                </template>
            </Dialog>
        </template>
    </div>
</template>
