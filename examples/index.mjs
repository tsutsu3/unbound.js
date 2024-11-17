import { UnboundControl } from "../dist/index.mjs";

const unixSocketName = "../unbound-config/unix/socket/unbound.ctl";
const control = new UnboundControl(unixSocketName);

control
  .sendCommand("status")
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.error(err);
  });
