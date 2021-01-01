
function BleLLControl(emitter) {
    this.emitter = emitter;
}
BleLLControl.prototype.decoderName = 'ble_ll_control';

BleLLControl.prototype.decode = function(raw_packet, offset) {

    if(this.emitter) { 
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = BleLLControl;