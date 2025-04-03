<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();

const loading = ref(true);
const categories = ref([]);
const category = ref({});
const selectedCategories = ref();
const categoryDialog = ref(false);
const deleteCategoryDialog = ref(false);
const deleteCategoriesDialog = ref(false);
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const token = localStorage.getItem('token');
const API_URL = 'http://localhost:8000/api/asset-categories';

onMounted(async () => {
    loading.value = true;
    await fetchCategories();
    loading.value = false;
});

async function fetchCategories() {
    try {
        const res = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        categories.value = res.data.data ?? res.data;
    } catch (err) {
        console.error('Gagal ambil kategori:', err);
    }
}

function openNew() {
    category.value = {};
    submitted.value = false;
    categoryDialog.value = true;
}

function hideDialog() {
    categoryDialog.value = false;
    submitted.value = false;
}

function confirmDeleteCategory(data) {
    category.value = data;
    deleteCategoryDialog.value = true;
}

function confirmDeleteSelected() {
    deleteCategoriesDialog.value = true;
}

async function saveCategory() {
    submitted.value = true;
    if (!category.value.name) return;

    try {
        if (category.value.id) {
            await axios.put(`${API_URL}/${category.value.id}`, category.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Kategori diperbarui', life: 3000 });
        } else {
            await axios.post(API_URL, category.value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'Kategori ditambahkan', life: 3000 });
        }

        fetchCategories();
        categoryDialog.value = false;
        category.value = {};
    } catch (error) {
        console.error('Save error:', error);
    }
}

async function deleteCategory() {
    try {
        await axios.delete(`${API_URL}/${category.value.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
        deleteCategoryDialog.value = false;
        toast.add({ severity: 'success', summary: 'Dihapus', detail: 'Kategori berhasil dihapus', life: 3000 });
    } catch (error) {
        console.error('Delete error:', error);
    }
}

function editCategory(data) {
    category.value = { ...data };
    categoryDialog.value = true;
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div class="card">
        <template v-if="loading">
            <Skeleton height="2rem" class="mb-2" v-for="n in 5" :key="n" />
        </template>
        <template v-else>
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Tambah" icon="pi pi-plus" class="mr-2" @click="openNew" />
                    <Button label="Hapus" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedCategories?.length" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedCategories"
                :value="categories"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
            >
                <template #header>
                    <div class="flex justify-between items-center">
                        <h4 class="m-0">Manajemen Kategori Aset</h4>
                        <InputText v-model="filters['global'].value" placeholder="Cari kategori..." />
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" />
                <Column field="name" header="Nama Kategori" sortable />
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded outlined class="mr-2" @click="editCategory(slotProps.data)" />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteCategory(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>

        <Dialog v-model:visible="categoryDialog" :style="{ width: '450px' }" header="Form Kategori Aset" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-3">Nama Kategori</label>
                    <InputText id="name" v-model="category.name" required autofocus :invalid="submitted && !category.name" class="w-full" />
                    <small v-if="submitted && !category.name" class="text-red-500">Wajib diisi.</small>
                </div>
            </div>
            <template #footer>
                <Button label="Batal" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Simpan" icon="pi pi-check" @click="saveCategory" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteCategoryDialog" header="Konfirmasi" :style="{ width: '450px' }" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-xl text-red-500" />
                <span
                    >Yakin ingin hapus <b>{{ category.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Tidak" icon="pi pi-times" text @click="deleteCategoryDialog = false" />
                <Button label="Ya" icon="pi pi-check" severity="danger" @click="deleteCategory" />
            </template>
        </Dialog>
    </div>
</template>
