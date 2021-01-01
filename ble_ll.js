const BleAdv = require('./ble_ll_advertising');
const BleLLControl = require('./ble_ll_control');
const BleLLData = require('./ble_ll_data');

const BLE_ADVERTISING_ACCESS_ADDRESS = 0x8e89bed6;
const BLE_LLID_DATA    = 0x02;
const BLE_LLID_CONTROL = 0x03;

function BLE_LL(emitter) {
    this.emitter = emitter;
    this.access_address = undefined // 4;
    this.crc = undefined;
}

BLE_LL.prototype.decoderName = "ble_ll";
BLE_LL.prototype.eventsOnDecode = true;

BLE_LL.prototype.decode = function(raw_packet, offset) {

    this.access_address = raw_packet.readUInt32LE(offset);
    offset += 4;

    let packet_header = raw_packet.readUInt16LE(offset);
    offset += 2;

    // dispatch to either the adv parser or data parser based on the access address
    switch(this.access_address) {
        case BLE_ADVERTISING_ACCESS_ADDRESS:
            this.pdu_type = packet_header & 0x0F;
            this.adv_data = new BleAdv(this.emitter).decode(this.pdu_type, raw_packet, offset);
            break;

        // All other access addresses are control / data
        default: 
            let llid = packet_header & 0x03;

            // data pdu depends on llid
            if(BLE_LLID_CONTROL == llid) {
                this.ll_control = new BleLLControl(this.emitter).decode(raw_packet, offset);
            }
            else if(BLE_LLID_DATA == llid) {
                this.ll_data = new BleLLData(this.emitter).decode(raw_packet, offset);
            }
            else {
                // empty pdu
                this.data_len = 0;
                this.ll_data = {};
            }
            break;
    }

    if(this.emitter) { 
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = BLE_LL;
