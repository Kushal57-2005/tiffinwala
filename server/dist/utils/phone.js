"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPhoneOTP = void 0;
const sendPhoneOTP = async (phone, otp) => {
    console.log(`📱 Phone OTP for ${phone}: ${otp}`);
    // TODO: Enable after Fast2SMS website verification is complete
    // await axios.post("https://www.fast2sms.com/dev/bulkV2", {
    //   route: "otp",
    //   variables_values: otp,
    //   numbers: phone,
    // }, {
    //   headers: { authorization: process.env.FAST2SMS_API_KEY as string },
    // });
};
exports.sendPhoneOTP = sendPhoneOTP;
//# sourceMappingURL=phone.js.map