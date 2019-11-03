<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="about">
    <h1>{{title}}</h1>
    <h3>Scannez ce QR-Code depuis l'appli baku-ui depuis votre smartphone:</h3>
    {{value}}
    <qrcode :value="value" :options="options" v-if="value"></qrcode>
    <video id="remoteVideo" playauto muted playsinline></video>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Map, Set } from "immutable";
import { Filter, Filters } from "@/components/filters";
import io from "socket.io-client";

@Component
export default class QrGenerator extends Vue {
  title = "Qr Generator";
  // value: string;
  value = `Scannez ce QR-Code dna=sctp-port:5000rnrna=max-message-size:262144rnrn"}`;

  options = {
    width: 100,
    scale: 1
  };

  socketId = "";
  socket: SocketIOClient.Socket = io();

  remoteVideo: any = null;
  peerConnection = new RTCPeerConnection();

  mounted() {
    console.log('IsConnected ?', this.$store.state.isConnected)
    this.$store.commit('setupConnection');
    console.log('IsConnected ?', this.$store.state.isConnected)
    this.remoteVideo = document.getElementById("remoteVideo");
    this.socket.on("connect", () => {
      this.socketId = this.socket.id;
    });

    this.socket.on("rtcAnswer", (msg: any) => {
      console.log('RTC AnsWER2', msg);
      this.peerConnection.setRemoteDescription(msg);
      console.log('CONNECTION OK');
      // CONNECTION OK
      this.$store.commit('setupConnection');
    });

    this.createOffer().then(offer => {
      console.log('QRCode de ', this.socketId);
      this.value = JSON.stringify(this.socketId);
      this.socket.emit("rtcOffer", { offer, offerer: this.socketId });
    });
  }

  public async createOffer() {
    const dataChannel = this.peerConnection.createDataChannel("channel", {});
    this.setChannelEvents(dataChannel);
    this.peerConnection.addEventListener("track", this.gotRemoteStream.bind(this));

    // Creating the offset
    try {
      const offerOptions: RTCOfferOptions = {
        offerToReceiveVideo: true
      };
      return await this.peerConnection.createOffer(offerOptions);
      // TODO: Generate QR code with the offset
    } catch (e) {
      console.error("Error creating offer", e);
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = event => {
      console.log("Message received", event);
    };
    channel.onopen = () => {
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


  private gotRemoteStream(e: any) {
    if (this.remoteVideo.srcObject !== e.streams[0]) {
      this.remoteVideo.srcObject = e.streams[0];
      console.log("pc2 received remote stream");
    }
  }
}
</script>
