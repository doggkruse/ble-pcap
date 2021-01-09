
const BleLL = require('./ble_ll');

function NordicBle(emitter) {
    this.emitter = emitter;
    this.ble_ll = {};
}
NordicBle.prototype.decoderName = 'nordic_ble';

NordicBle.prototype.decode = function(raw_packet, offset) {
    this.board = raw_packet[offset++];
    
    // skip header for now
    offset += 6;

    // skip length of packet
    offset++;

    this.flags = raw_packet[offset++];

    let channel = raw_packet[offset++];
    this.signal_dbm = -raw_packet[offset++];

    // remap back to RF channel
    if(channel == 39) {
        this.rf_channel = 39;
    }
    else if(channel == 37) {
        this.rf_channel = 0;
    }
    else if(channel == 38) {
        this.rf_channel = 12;
    }
    else if(channel >= 11) {
        this.rf_channel = channel + 2;
    }
    else if(channel >= 1) {
        this.rf_channel = channel + 1;
    }

    this.event_counter = raw_packet.readUInt16LE(offset);
    offset += 2;

    this.delta_time = raw_packet.readUInt32LE(offset);
    offset += 4;

    // stop processing bad checksum for now
    if( (this.flags & 0x01) == 0 ) {
        return this;
    }

    this.phy = (this.flags & 0x70) >> 4;

    this.ble_ll = new BleLL(this.emitter).decode(raw_packet, offset);

    if(this.emitter) {
        this.emitter.emit(this.decoderName, this);
    }

    return this;
}

module.exports = NordicBle;