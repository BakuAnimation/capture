<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="about">
    <h1>{{title}}</h1>
    <h3>Scannez ce QR-Code depuis l'appli baku-ui depuis votre smartphone:</h3>
    {{value}}
    <qrcode :value="value" :options="options" v-if="value"></qrcode>
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
    width: 1000,
    scale: 1
  };

  socketId = 0;
  socket: SocketIOClient.Socket = io();

  remoteVideo: any = null;
  peerConnection = new RTCPeerConnection();

  mounted() {
    this.remoteVideo = document.getElementById("remoteVideo");
    this.socket.on("connect", (socket: any) => {
      this.socketId = socket.id;
    });

    this.socket.on("rtcAnswer", (msg: any) => {
      this.peerConnection.setRemoteDescription(msg.answer);

      // CONNECTION OK
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
    // peerConnection.addEventListener("icecandidate", e =>
    //   this.onIceCandidate(peerConnection, e)
    // );
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

  // private async onIceCandidate(pc, event) {
  //   try {
  //     await getOtherPc(pc).addIceCandidate(event.candidate);
  //   } catch (e) {
  //     onAddIceCandidateError(pc, e);
  //   }
  // }

  // private onAddIceCandidateError(pc, error) {
  //   console.log(
  //     `${getName(pc)} failed to add ICE Candidate: ${error.toString()}`
  //   );
  // }

  private gotRemoteStream(e: any) {
    if (this.remoteVideo.srcObject !== e.streams[0]) {
      this.remoteVideo.srcObject = e.streams[0];
      console.log("pc2 received remote stream");
    }
  }
}
</script>
