'use strict';


//TODO: The fact that this is not in messageLegend is incredibly confusing.

/*
#define MSG_FLAG_IDEMPOTENT   0x0001      // Indicates that only one of the given message should be enqueue.
#define MSG_FLAG_EXPORTABLE   0x0002      // Indicates that the message might be sent between systems.
#define MSG_FLAG_DEMAND_ACK   0x0004      // Demands that a message be acknowledged if sent outbound.
#define MSG_FLAG_AUTH_ONLY    0x0008      // This flag indicates that only an authenticated session can use this message.
#define MSG_FLAG_EMITS        0x0010      // Indicates that this device might emit this message.
#define MSG_FLAG_LISTENS      0x0020      // Indicates that this device can accept this message.

#define MSG_FLAG_RESERVED_9   0x0040      // Reserved flag.
#define MSG_FLAG_RESERVED_8   0x0080      // Reserved flag.
#define MSG_FLAG_RESERVED_7   0x0100      // Reserved flag.
#define MSG_FLAG_RESERVED_6   0x0200      // Reserved flag.
#define MSG_FLAG_RESERVED_5   0x0400      // Reserved flag.
#define MSG_FLAG_RESERVED_4   0x0800      // Reserved flag.
#define MSG_FLAG_RESERVED_3   0x1000      // Reserved flag.
#define MSG_FLAG_RESERVED_2   0x2000      // Reserved flag.
#define MSG_FLAG_RESERVED_1   0x4000      // Reserved flag.
#define MSG_FLAG_RESERVED_0   0x8000      // Reserved flag.
*/


/** These are flags that are attached to a message legend. */
var messageFlags = {
  IDEMPOTENT: 0x0001,
  EXPORTABLE: 0x0002,
  DEMAND_ACK: 0x0004,
  AUTH_ONLY:  0x0008,
  EMITS:      0x0010,
  LISTENS:    0x0020
};

module.exports = messageFlags;
