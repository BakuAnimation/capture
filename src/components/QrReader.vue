<template>
  <div class="about">
    <h1>This is an about page</h1>

    <p class="error">{{ error }}</p>

    <p class="decode-result">
      Last result:
      <b>{{ socketId }}</b>
    </p>

    <qrcode-stream @decode="onDecode" @init="onInit" />
  </div>
</template>


<script lang="ts">
import { QrcodeStream } from "vue-qrcode-reader";

import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import io from "socket.io-client";

@Component({
  components: { QrcodeStream }
})
export default class QrReader extends Vue {
  socketId: string | undefined = undefined;
  socket = io();

  error = "";
  peerConnection = new RTCPeerConnection();

  mounted() {}

  onDecode(result: string) {
    console.log("onDecode:", this.socketId);
    if (!this.socketId) {
      console.log("result", result);
      this.socketId = result;
      this.socket.on("rtcOffer", (msg: any) => {
        console.log('MSG ', msg, this.socketId, result);
        this.startStream(msg);
      });
      this.socket.emit("getOffer", this.socketId);
    }
  }

  async onInit(promise: Promise<any>) {
    try {
      await promise;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        this.error = "ERROR: you need to grant camera access permisson";
      } else if (error.name === "NotFoundError") {
        this.error = "ERROR: no camera on this device";
      } else if (error.name === "NotSupportedError") {
        this.error = "ERROR: secure context required (HTTPS, localhost)";
      } else if (error.name === "NotReadableError") {
        this.error = "ERROR: is the camera already in use?";
      } else if (error.name === "OverconstrainedError") {
        this.error = "ERROR: installed cameras are not suitable";
      } else if (error.name === "StreamApiNotSupportedError") {
        this.error = "ERROR: Stream API is not supported in this browser";
      }
    }
  }

  private async startStream(remoteOffer: any) {
    // const localVideo: any = document.getElementById('localVideo');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    console.log("Received local stream");
    // localVideo.srcObject = stream;
    // TODO: get remoteOffer from QR

    this.peerConnection.ondatachannel = event => {
      const dataChannel = event.channel;
      this.setChannelEvents(dataChannel);
    };
    // peerConnection.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
    stream
      .getVideoTracks()
      .forEach(track => this.peerConnection.addTrack(track, stream));
    try {
      console.log("remoteOffer", remoteOffer, this.peerConnection);
      const res = await this.peerConnection.setRemoteDescription(remoteOffer);
      console.log("RES", res);
    } catch (e) {
      console.error("Failed to set remote description", e);
    }
    try {
      console.log("createAnswer", this.socketId);
      const answer = await this.peerConnection.createAnswer();
      this.peerConnection.setLocalDescription(answer);
      this.socket.emit("rtcAnswer", { answer, offerer: this.socketId });
    } catch (e) {
      console.error("Failed sending answer", e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = function(event) {
      console.log("Message received", event);
    };
    channel.onopen = function() {
      const channelpush = channel.send;
      channel.send = (data: Object) => {
        console.log("Sending message: ", data);
        channelpush(JSON.stringify(data));
      };
    };

    channel.onerror = function(e) {
      console.error("channel.onerror", JSON.stringify(e, null, "\t"));
    };

    channel.onclose = function(e) {
      console.warn("channel.onclose", JSON.stringify(e, null, "\t"));
    };
  }
}
</script>

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
</style>