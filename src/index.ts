import { AppDataSource } from "./data-source";
import { Colors, Users } from "./entity/User";
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
    await dataBase.CreateDevice(deviceId);
    await createRandomData();
    await dataBase.CreateContactForm(
      useremail,
      "message",
      "topic-"
    );
    newlymadeUser = await dataBase.GetUser(undefined, useremail);
    await dataBase.CreatePasswordReset(Token, newlymadeUser.userId);
  })
  .catch((error) => {
    console.error(error);
  })
  .then(async () => {
    await dataBase.EditAccount(newlymadeUser.userId,"Hello","world","Hel"+randomgen(999,-999)+"d@hotmail.com","+32491"+randomgen(3999,3001)+"48",Colors.GREEN,Colors.RED);
    await dataBase.CreateAdministrator(newlymadeUser.userId);
    await dataBase.coupleUserToDevice(
      newlymadeUser.userId,
      deviceId
    );
    let userdata = await dataBase.GetUser(newlymadeUser.userId)
    let passwordsMatch = await Crypt.matchesEncrypted(userpassword,userdata.password)
    await dataBase.ChangePassword(newlymadeUser.userId, "changedPassword");
    console.log("cleaning temp data...");
    await dataBase.CleanTemporaryData();
    await CreateRAndomDataForFirstDevice();
    logresults("USER OBJECT", userdata);
    if(passwordsMatch){
      console.log("PASSWORDS MATCH")
    }else {
      console.log("PASSWORDS DON'T MATCH")
    }
    logresults(
      "ADMINISTRATOR OBJECT",
      await dataBase.GetAdministrator(newlymadeUser.userId)
    );
    //logresults("FORM", await dataBase.GetContactForm("topic-"));
    logresults("DEVICE OBJECT", await dataBase.GetDevices(newlymadeUser.userId-1));
    await dataBase.DeleteExpiredPasswordReset();
    logresults("DATA OBJECT", await dataBase.GetData(newlymadeUser.userId-1));
  });

function logresults(label: string, input: any) {
  console.log("[|]".repeat(50));
  console.log(label);
  console.log(input);
  console.log("[|]".repeat(50));
}
async function createRandomData() {
  let alldevices: Device[] = await Device.find();
  let currentDate = new Date()
  alldevices.forEach(async (device) => {
    for (let i = 0; i < 500; i++) {
      await dataBase.CreateTempData(
        device.deviceId,
        randomgen(100 + i, 90 + i),
        randomgen(100 + i, 90 + i),
        new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDay(),currentDate.getHours(),currentDate.getMinutes()-i)
      );
    }
    

  });
}

async function CreateRAndomDataForFirstDevice(){
  let device = await Device.findOneBy({device_index:1})
  let currentDate = new Date();
  for (let i = 0; i < 100; i++) {
    await dataBase.CreateTempData(
    device.deviceId,
    randomgen(100 + i, 90 + i),
    randomgen(100 + i, 90 + i),
    new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDay(),currentDate.getHours(),currentDate.getMinutes()-(i*15))
    )
  }
}