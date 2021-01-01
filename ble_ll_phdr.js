let BleLL = require('./ble_ll');

function BleLLPhdr(emitter) {
    this.emitter = emitter;
}
BleLLPhdr.prototype.decoderName = 'ble_ll_phdr';

BleLLPhdr.prototype.decode = function(raw_packet, offset) {
    this.rf_channel = raw_packet[offset++];
    this.signal_dbm = raw_packet.readInt8(offset++);

    // skip unused
    offset += 6;

    this.flags = raw_packet.readUInt16LE(offset);
    offset += 2;

    this.ble_ll = new BleLL(this.emitter).decode(raw_packet, offset);

    if(this.emitter) { 
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = BleLLPhdr;
