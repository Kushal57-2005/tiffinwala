export const sendPhoneOTP = async (
    phone: string,
    otp: string,
): Promise<void> => {
    void phone;
    void otp;

    // TODO: Enable after Fast2SMS website verification is complete
    // await axios.post("https://www.fast2sms.com/dev/bulkV2", {
    //   route: "otp",
    //   variables_values: otp,
    //   numbers: phone,
    // }, {
    //   headers: { authorization: process.env.FAST2SMS_API_KEY as string },
    // });
};
