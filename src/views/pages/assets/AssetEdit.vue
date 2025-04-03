<script setup>
import axios from 'axios';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const form = ref({
    name: '',
    serial_number: '',
    category_id: '',
    condition_id: '',
    location_id: ''
});

const categories = ref([]);
const conditions = ref([]);
const locations = ref([]);

const token = localStorage.getItem('token');

onMounted(async () => {
    await fetchAsset();
    await fetchMasterData();
});

async function fetchAsset() {
    try {
        const res = await axios.get(`http://localhost:8000/api/assets/${route.params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        form.value = res.data;
    } catch (err) {
        console.error('Gagal ambil data aset:', err);
    }
}

async function fetchMasterData() {
    const headers = { Authorization: `Bearer ${token}` };
    const [cat, cond, loc] = await Promise.all([
        axios.get('http://localhost:8000/api/asset-categories', { headers }),
        axios.get('http://localhost:8000/api/asset-conditions', { headers }),
        axios.get('http://localhost:8000/api/asset-locations', { headers })
    ]);
    categories.value = cat.data;
    conditions.value = cond.data;
    locations.value = loc.data;
}

async function submitForm() {
    try {
        await axios.put(`http://localhost:8000/api/assets/${route.params.id}`, form.value, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('Berhasil disimpan!');
        router.push('/assets');
    } catch (err) {
        console.error('Gagal update aset:', err);
    }
}
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Edit Aset</h1>

        <form @submit.prevent="submitForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label>Nama Aset</label>
                <InputText v-model="form.name" class="w-full" />
            </div>

            <div>
                <label>Serial Number</label>
                <InputText v-model="form.serial_number" class="w-full" />
            </div>

            <div>
                <label>Kategori</label>
                <Dropdown v-model="form.category_id" :options="categories" optionLabel="name" optionValue="id" class="w-full" />
            </div>

            <div>
                <label>Kondisi</label>
                <Dropdown v-model="form.condition_id" :options="conditions" optionLabel="name" optionValue="id" class="w-full" />
            </div>

            <div>
                <label>Lokasi</label>
                <Dropdown v-model="form.location_id" :options="locations" optionLabel="name" optionValue="id" class="w-full" />
            </div>

            <div class="col-span-2 flex justify-end mt-4">
                <Button label="Simpan Perubahan" icon="pi pi-save" type="submit" />
            </div>
        </form>
    </div>
</template>
