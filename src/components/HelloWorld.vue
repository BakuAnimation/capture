<template>
    <div class="container vertical">
        <div class="container centered">
            <video id="video"
                   autoplay
                   v-if="videoStream"
                   :srcObject.prop="videoStream"
                   width="640"
                   height="480"
            ></video>
            <img alt="imgId" id="imgId" :src.prop="captureSrc"/>
        </div>
        <div class="container centered">
            <button id="takePhotoButtonId" @click="record">Record</button>
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
        <div>
            {{ storageDetails }}
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

    @Component
    export default class HelloWorld extends Vue {
        private videoStream: MediaStream | null = null;
        private storageDetails: string = "";
        private captureSrc: string = "";
        private cameras: Set<Device> = Set();
        private selectedCamera: string = "";
        private mediaRecorder?: MediaRecorder;

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
            const {usage, quota} = await navigator.storage.estimate();
            const percentUsed = Math.round(usage!! / quota!! * 100);
            const usageInMib = Math.round(usage!! / (1024 * 1024));
            const quotaInMib = Math.round(quota!! / (1024 * 1024));

            this.storageDetails = `${usageInMib} out of ${quotaInMib} MiB used (${percentUsed}%)`;

            this.openCamera();
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

        @Watch('selectedCamera')
        onCameraChanged(value: string, previous: string) {
            this.openCamera(this.selectedCamera);
        }

        toggleCamera() {
        }

        record() {
            const imageCapture = new ImageCapture(this.videoStream);
            //imageCapture.
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
        align-items: baseline;
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
