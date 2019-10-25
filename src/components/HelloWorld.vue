<template>
    <div class="container vertical">
        <div class="container centered">
            <video ref="video" autoplay v-if="videoStream" :srcObject.prop="videoStream" width="640"
                   height="480"></video>
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
        <div class="">
            <RecycleScroller
                    direction="vertical"
                    class="scroller"
                    :items="captures"
                    :item-size="captures.length"
                    v-slot="{ item , index}"
            >
                <img :key="index" :src="item.src"/>
            </RecycleScroller>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from "vue-property-decorator";
    import {Map, Set} from "immutable";
    import {RecycleScroller} from "vue-virtual-scroller";

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
    }

    @Component({
        components: {
            RecycleScroller
        }
    })
    export default class HelloWorld extends Vue {
        private videoStream: MediaStream | null = null;
        private storageDetails: string = "";
        private captures: Capture[] = [];
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
            await this.refreshStorage();

            this.openCamera();
        }

        private async refreshStorage() {
            const {usage, quota} = await navigator.storage.estimate();
            const percentUsed = Math.round(usage!! / quota!! * 100);
            const usageInMib = Math.round(usage!! / (1024 * 1024));
            const quotaInMib = Math.round(quota!! / (1024 * 1024));

            this.storageDetails = `${usageInMib} out of ${quotaInMib} MiB used (${percentUsed}%)`;
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
                    this.mediaRecorder = new MediaRecorder(this.videoStream);
                    // const chunks: BlobPart[] = [];

                    this.mediaRecorder.onstop = (e: any) => {
                        /*console.log("data available after MediaRecorder.stop() called.");
        
                        const audio = document.createElement('audio');
                        audio.controls = true;
                        const blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'});
                        const audioURL = window.URL.createObjectURL(blob);
                        audio.src = audioURL;*
                        console.log("recorder stopped");*/
                    };

                    this.mediaRecorder.ondataavailable = (e: any) => {
                        console.log("Image captured", e);
                        const src = window.URL.createObjectURL(e.data);
                        console.log("src", src);
                        this.captures.push({src: src});
                    };
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

        async record() {
            /*if (this.mediaRecorder.state == "recording") {
                this.mediaRecorder.stop();
                console.log(this.mediaRecorder.state);
            } else {
                this.mediaRecorder.start();
                console.log(this.mediaRecorder.state);
            }*/
            let canvas = document.createElement("canvas");
            const video = this.$refs.video;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
            let src = canvas.toDataURL("image/jpg", 0.1);
            this.captures.push({id: src, src: src});

            await this.refreshStorage();
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

    .scroller {
        height: 100%;
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
