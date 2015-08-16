'use strict';

function messageAction() {

}

messageAction.prototype.process = function(jsonBuff) {
  switch (jsonBuff.messageId) {
    case 'LEGEND_MESSAGES':
      jsonBuff.action = 'update_legend'
  }


};

var derp = {
  'LEGEND_MESSAGES': {
    callback: function(args) {
      merge(this.legendMessage, args)
    }
  }
}



module.exports = messageAction;
