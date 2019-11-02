<template>
  <div>
    <HelloWorld v-if="isConnected" />
    <QrGenerator v-else />
  </div>
</template>

<script lang="ts">
import HelloWorld from "@/components/HelloWorld.vue";
import QrGenerator from "@/components/QrGenerator.vue";
 import {Component, Vue, Watch} from "vue-property-decorator";
import {Map, Set} from "immutable";
import {Filter, Filters} from "@/components/filters";
import { Getter } from 'vuex-class';


@Component({
  components: {
    HelloWorld,
    QrGenerator
  }
})
export default class ComputerView extends Vue {
  @Getter
  isConnected = false;

};
</script>

<style>
</style>
