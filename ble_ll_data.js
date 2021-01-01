
function BleLLData(emitter) {
    this.emitter = emitter;
}
BleLLData.prototype.decoderName = 'ble_ll_data';

BleLLData.prototype.decode = function(raw_packet, offset) {
    // get the payload len
    this.data_len = raw_packet[offset++];

    if(this.emitter) { 
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = BleLLData;