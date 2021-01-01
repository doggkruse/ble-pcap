# ble-pcap

Node library for working with BLE packet captures.  Still WIP and things may change.

Requires [node-pcap](https://github.com/node-pcap/node_pcap) and attempts to follow the same design pattern.

## Installation

npm install ble-pcap
## usage

Due to a limitation of the current node-pcap design, there's no clean way to add DLTs to be parsed.  To work around this, ble-pcap does some method swizzling to introduce its DLTs to the pcap library

Example Initialization

```javascript
const pcap = require('pcap');
const ble_pcap = require('ble-pcap');

// let node-pcap know about our DLTs
ble_pcap.register_dlts();

// open pcap and begin parsing packets
let session =  pcap.createOfflineSession(PCAP_FILENAME);

session.on('packet', (raw_packet) => {
    let packet = pcap.decode.packet(raw_packet);
});
```


