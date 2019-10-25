<template>
    <div class="container vertical">
        <div class="container">
            <video
                    id="video"
                    autoplay="true"
                    v-if="streamSrcObject"
                    :srcObject.prop="streamSrcObject"
            ></video>
            <img alt="imgId" id="imgId" :src="captureSrc"/>
        </div>
        <div class="container">
            <button id="takePhotoButtonId" @click="takePhoto">Take photo</button>
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
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";
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
        private streamSrcObject: MediaStream | null = null;
        private captureSrc: string = "";
        private cameras: Set<Device> = Set();
        private selectedCamera: string | null = null;

        mounted() {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                    this.cameras = Set(devices.filter(d => d.kind === "videoinput"))
                        .reduce((acc, d) => acc.set(d.deviceId, new Device(d.deviceId, d.label)), Map<string, Device>())
                        .toSet();
                    const first = this.cameras.first<Device>();
                    if (first) {
                        this.selectedCamera = first.id;
                    }
                }
            );
            let
                constraints = {
                    audio: false,
                    video: {
                        facingMode: "front",
                        width: {min: 640, ideal: 1920, max: 1920},
                        height: {min: 640, ideal: 1080, max: 1080}
                    }
                };
            navigator
                .mediaDevices
                .getUserMedia(constraints)

                .then(stream

                        => {
                        this
                            .streamSrcObject = stream;
                    }
                )
                .catch(e => {
                    console.log("Unable to read from webcam ", e);
                });
        }

        toggleCamera() {
        }

        takePhoto() {
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
