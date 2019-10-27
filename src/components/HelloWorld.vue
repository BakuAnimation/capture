<template>
    <div class="container vertical">
        <div class="container centered">
            <video ref="video" autoplay v-if="videoStream" :srcObject.prop="videoStream" width="640"
                   :style="computedEffect"
                   height="480"></video>
        </div>
        <div class="container centered">
            <button id="takePhotoButtonId" @click="record" :disabled="capturing">Take photo</button>
            <button id="stopCameraButtonId" @click="toggleCamera">
                Stop/start camera
            </button>
            <label>
                <select v-model="selectedCamera">
                    <option v-for="camera in cameras"
                            :key="camera.id"
                            :value="camera.id">
                        {{ camera.label }}
                    </option>
                </select>
            </label>
        </div>
        <div class="container">
            <label>
                Effect :
                <select v-model="appliedEffect">
                    <option v-for="effect in effects"
                            :key="effect.name"
                            :value="effect.name">
                        {{ effect.name }}
                    </option>
                </select>
            </label>
            <label>
                
            </label>
        </div>
        <div>
            {{ storageDetails }}
        </div>
        <div class="gallery">
            <img alt="" v-for="( item, index ) in captures" :key="index" :src="item.src" class="gallery-img"/>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from "vue-property-decorator";
    import {Map, Set} from "immutable";

    class Device {

        constructor(id: string, label: string) {
            this.id = id;
            this.label = label;
        }

        readonly id: string;
        readonly label: string;

    }

    interface Capture {
        readonly src: string;
        readonly sizeInBytes: number;
    }

    @Component
    export default class HelloWorld extends Vue {
        private videoStream: MediaStream | null = null;
        private storageDetails: string = "";
        private captures: Capture[] = [];
        private cameras: Set<Device> = Set();
        private selectedCamera: string = "";
        private capturing: boolean = false;

        private effects = [
            {name: "none", unit: "none"},
            {name: "blur", unit: "length"},
            {name: "brightness", unit: "percent"},
            {name: "contrast", unit: "percent"},
            {name: "grayscale", unit: "percent"},
            {name: "hue-rotate", unit: "angle"},
            {name: "invert", unit: "percent"},
            {name: "opacity", unit: "percent"},
            {name: "saturate", unit: "percent"},
            {name: "sepia", unit: "percent"}
        ];

        private appliedEffect = "none";
        private effectValue = 5;

        async mounted() {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                        this.cameras = Set(devices.filter(d => d.kind === "videoinput"))
                            .reduce((acc, d) => acc.set(d.deviceId, new Device(d.deviceId, d.label)), Map<string, Device>())
                            .toSet();
                        const first = this.cameras.first<Device>();
                        if (first) {
                            this.selectedCamera = first.id;
                        }
                    }
                );
            await this.refreshStorage();

            this.openCamera();
        }

        private async refreshStorage() {
            const total = this.captures.reduce((acc, value) => acc + value.sizeInBytes, 0);
            const average = total / this.captures.length;
            const averageFormatted = this.formatBytes(average);
            const totalFormatted = this.formatBytes(total);

            const {usage, quota} = await navigator.storage.estimate();
            const usageFormatted = this.formatBytes(usage!);
            const quotaFormatted = this.formatBytes(quota!);

            this.storageDetails = `${this.captures.length} captures ~ ${averageFormatted} / ${totalFormatted}. Storage ${usageFormatted}/${quotaFormatted}`;
        }

        private formatBytes(bytes: number, decimals = 2): string {
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        private openCamera(camera?: string) {
            const constraints = {
                audio: false,
                video: {
                    deviceId: camera,
                    facingMode: "front",
                    width: {min: 640, ideal: 1920, max: 1920},
                    height: {min: 640, ideal: 1080, max: 1080}
                }
            };
            navigator
                .mediaDevices
                .getUserMedia(constraints)
                .then(stream => {
                    this.videoStream = stream;
                })
                .catch(e => {
                    console.log("Unable to read from web-cam ", e);
                });

        }

        get computedEffect() {
            if (this.appliedEffect == "none") {
                return "";
            }
            return `filter: ${this.appliedEffect}(${this.effectValue})`;
        }

        @Watch('selectedCamera')
        onCameraChanged(value: string, previous: string) {
            this.openCamera(this.selectedCamera);
        }

        toggleCamera() {
        }

        async record() {
            this.capturing = true;
            let canvas = document.createElement("canvas");
            const video = this.$refs.video as HTMLVideoElement;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async blob => {
                const sizeInBytes = blob!.size;
                const src = URL.createObjectURL(blob);
                this.captures.push({src, sizeInBytes});

                await this.refreshStorage();
                this.capturing = false;
            }, "image/jpg", 1);
        }
    }
</script>

<style scoped>
    .container {
        display: flex;
    }

    .vertical {
        flex-direction: column;
    }

    .centered {
        justify-content: center;
        align-items: center;
    }

    .gallery {
        margin-top: 20px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 20px;
        width: 99%;
        height: 174px;
        overflow-x: auto;
        white-space: nowrap;
        background-color: rgb(52, 143, 235);
    }

    .gallery-img {
        cursor: pointer;
        margin-left: 10px;
        margin-right: 10px;
        margin-bottom: 10px;
        width: 256px;
        height: 144px;
        background-color: rgb(52, 143, 235);
    }

    h3 {
        margin: 40px 0 0;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    a {
        color: #42b983;
    }
</style>
