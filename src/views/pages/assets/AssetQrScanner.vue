<script setup>
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import { nextTick, ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';

const toast = useToast();
const token = localStorage.getItem('token');

const result = ref('');
const error = ref('');
const detailVisible = ref(false);
const assetDetail = ref(null);

function onCameraReady() {
    console.log('Kamera aktif, siap scan!');
}

function onError(err) {
    console.error('QR Error:', err);
    toast.add({ severity: 'error', summary: 'QR Gagal', detail: err.message });
}

function paintBoundingBox(detectedCodes, ctx) {
    for (const { boundingBox } of detectedCodes) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
    }
}

async function onDetect([data]) {
    const url = data.rawValue;

    if (result.value === url) return; // Cegah trigger ulang

    result.value = url;

    try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        console.log('API Result:', res.data);

        assetDetail.value = res.data;

        detailVisible.value = false;
        await nextTick();
        detailVisible.value = true;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Tidak bisa ambil detail aset' });
        console.error(err);
    }

    setTimeout(() => {
        result.value = '';
    }, 2000); // Setelah 2 detik boleh scan ulang QR yang sama
}
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Scan QR Code Aset</h4>

        <qrcode-stream :track="paintBoundingBox" @detect="onDetect" @error="onError" @camera-on="onCameraReady" />

        <p class="mt-4 text-green-600" v-if="result">
            Hasil Scan: <b>{{ result }}</b>
        </p>

        <!-- Modal Detail Aset -->
        <Dialog v-model:visible="detailVisible" header="Detail Aset" :modal="true" :style="{ width: '600px' }">
            <div v-if="assetDetail">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="font-bold block mb-1">Nama Aset</label>
                        <InputText :modelValue="assetDetail.name" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Kode Aset</label>
                        <InputText :modelValue="assetDetail.asset_code" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Serial Number</label>
                        <InputText :modelValue="assetDetail.serial_number" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Kategori</label>
                        <InputText :modelValue="assetDetail.category?.name" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Jenis Aset</label>
                        <InputText :modelValue="assetDetail.type?.name" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Lokasi</label>
                        <InputText :modelValue="assetDetail.location?.name" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Kondisi</label>
                        <InputText :modelValue="assetDetail.condition?.name" readonly class="w-full" />
                    </div>
                    <div>
                        <label class="font-bold block mb-1">Penanggung Jawab</label>
                        <InputText :modelValue="assetDetail.responsible?.username" readonly class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="font-bold block mb-1">Tanggal Perolehan</label>
                        <InputText :modelValue="assetDetail.acquisition_date" readonly class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Tutup" icon="pi pi-times" @click="detailVisible = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.qrcode-stream {
    max-width: 100%;
}
</style>
