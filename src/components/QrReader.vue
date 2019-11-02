<template>
  <div class="about">
    <h1>This is an about page</h1>

    <p class="error">{{ error }}</p>

    <p class="decode-result">
      Last result:
      <b>{{ result }}</b>
    </p>

    <qrcode-stream @decode="onDecode" @init="onInit" />
  </div>
</template>


<script>
import { QrcodeStream } from "vue-qrcode-reader";

import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import { io } from "socket.io";

@Component({
  components: { QrcodeStream }
})
export default class QrReader extends Vue {
  socketId = 0;
  socket = io();

  mounted() {
    this.socket.on("rtcOffer", msg => {
      this.startStream(msg, this.socketId);
    });
  }

  onDecode(result) {
    console.log("onDecode", result);
    this.socketId = result;
    this.socket.emit("getOffer", this.socketId);

    
  }

  async onInit(promise) {
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

  private async startStream(remoteOffer, offerer) {
    const localVideo = document.getElementById('localVideo');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    // TODO: get remoteOffer from QR
    peerConnection = new RTCPeerConnection();
    peerConnection.ondatachannel = function (event) {
        dataChannel = event.channel;
        setChannelEvents(dataChannel);
    };
    peerConnection.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
    localStream.getVideoTracks().forEach(track => pc1.addTrack(track, localStream));
    try {
        await peerConnection.setRemoteDescription(remoteOffer);
    } catch (e) {
        console.error('Failed to set remote description', e);
    } 
    try {
        answer = await peerConnection.createAnswer();
        peerConnection.setLocalDescription(answer);
        socket.emit('rtcAnswer', { answer, offerer});
    } catch(e) {
        console.error('Failed sending answer',e);
    }
}

private setChannelEvents(channel) {
    channel.onmessage = function (event) {
        console.log('Message received', event);
    };
    channel.onopen = function () {
        channel.push = channel.send;
        channel.send = function (data) {
            console.log('Sending message: ', data);
            channel.push(JSON.stringify(data));
        };
    };

    channel.onerror = function (e) {
        console.error('channel.onerror', JSON.stringify(e, null, '\t'));
    };

    channel.onclose = function (e) {
        console.warn('channel.onclose', JSON.stringify(e, null, '\t'));
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