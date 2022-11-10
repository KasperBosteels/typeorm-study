import { AppDataSource } from "./data-source";
import { Users } from "./entity/User";
import { DataProcessor } from "./DataProcessing";
import { Crypt } from "./crypt";
import { Device } from "./entity/Device";
const dataBase = new DataProcessor();
let randomgen = (max: number = 100, min: number = 0) =>
  Math.round(Math.random() * (max - min)) + min;
const userpassword = `${randomgen(999999999)}`;
const useremail = `${randomgen(9999999)}@hotmail.com`;
const userphone = `+32${randomgen(499999995, 400000001)}`;
let tempdeviceId = `BBABDCAZERFSQSFJKIOLMODEKFJSLPODPOEkldslerfre${randomgen(
  99999999999999999999990,
  10000000000000000000000
)}`;
let deviceId = tempdeviceId;
if (tempdeviceId.length > 64) deviceId = tempdeviceId.slice(1, 65);
if (tempdeviceId.length < 64) deviceId += "A";
const Token = Crypt.encrypt(
  `${randomgen(10000000000000000000000000000000000000)}`
);
var newlymadeUser: Users;
AppDataSource.initialize()
  .then(async () => {
    await dataBase.CreateUser(
      "Tom",
      "Tommy",
      useremail,
      userpassword,
      userphone
    );
    console.log("creating new device:");
    await dataBase.CreateDevice(deviceId);

    //console.log("creating new random data...");
    //await createRandomData();

    await dataBase.CreateContactForm(
      useremail,
      "this is a long message",
      "this is a message topic"
    );

    //get user
    newlymadeUser = await dataBase.GetUser(undefined, useremail);

    await dataBase.CreatePasswordReset(Token, newlymadeUser.userId);
  })
  .catch((error) => {
    console.error(error);
  })
  .then(async () => {
    await dataBase.ChangePassword(newlymadeUser.userId, "changedPassword");
    await dataBase.CreateAdministrator(newlymadeUser.userId);
    await dataBase.coupleUserToDevice(newlymadeUser.userId, deviceId);
    console.log("cleaning temp data...");
    await dataBase.CleanTemporaryData();
    logresults(
      "USER OBJECT",
      await dataBase.GetUser(newlymadeUser.userId, undefined)
    );
    logresults(
      "ADMINISTRATOR OBJECT",
      await dataBase.GetAdministrator(newlymadeUser.userId)
    );
    logresults("FORM", await dataBase.GetContactForm(undefined, useremail));
    logresults(
      "DEVICE OBJECT",
      await dataBase.GetDevices(newlymadeUser.userId)
    );
    const endDate = new Date();
    const startDate = new Date(2022, 10, 7, 0, 0, 30, 0);
    await dataBase.DeleteExpiredPasswordReset();
    logresults("DATA OBJECT", await dataBase.GetData(9, endDate, startDate));
  });

function logresults(label: string, input: any) {
  console.log("[|]".repeat(50));
  console.log(label);
  console.log(input);
  console.log("[|]".repeat(50));
}
async function createRandomData() {
  let alldevices: Device[] = await Device.find();
  alldevices.forEach((device) => {
    for (let i = 0; i < 500; i++) {
      dataBase.CreateTempData(
        device.deviceId,
        randomgen(100 + i, 90 + i),
        randomgen(100 + i, 90 + i)
      );
    }
  });
}
