import { Administrator } from "./entity/Administrator";
import { Data } from "./entity/Data";
import { Users } from "./entity/User";
import { Device } from "./entity/Device";
import { AppDataSource } from "./data-source";
import { TemporaryData } from "./entity/TemporaryData";
import { Password_Reset } from "./entity/Password_Reset";
import { Equal, LessThan, MoreThan, MoreThanOrEqual } from "typeorm";
import { ContactForm } from "./entity/contact";
import { validate } from "class-validator";
interface dailyTotalData {
  deviceId: string;
  day: number;
  night: number;
}
interface DeviceSpecificData {
  deviceindex: number;
  deviceAlias: string;
  data: Data[];
  tempData: TemporaryData;
}
export class DataProcessor {
  //#region Create Data
  public async CreateDevice(DeviceId: string, alias?: string) {
    const newDevice = new Device();
    newDevice.deviceId = DeviceId;
    if (alias) newDevice.friendlyName = alias;

    if (await this.ValidateObject(newDevice)) {
      await Device.save(newDevice);
    }
  }
  public async CreateUser(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    phoneNUmber: string
  ): Promise<Number> {
    const newUser = new Users();
    newUser.email = email;
    newUser.password = password;
    newUser.firstname = firstname;
    newUser.lastname = lastname;
    newUser.device = [];
    newUser.phone = phoneNUmber;

    const errors = await validate(newUser);
    if (errors.length > 0) {
      console.log(errors);
      throw new Error("validation for user failed");
    } else {
      return (await Users.save(newUser)).userId;
    }
  }
  public async CreateData(
    deviceid: string,
    dataDay?: number,
    DataNight?: number,
    date?: Date
  ): Promise<void> {
    let datadevice = await Device.findOneBy({ deviceId: deviceid });
    const newData = new Data();
    newData.device = datadevice;
    if (dataDay) newData.day = dataDay;
    if (DataNight) newData.night = DataNight;
    if (date) newData.created_at = date;
    await validate(newData).then(async (result) => {
      if (result.length > 0) {
        console.log(result);
        throw new Error("validation for Data failed");
      } else {
        await Data.save(newData);
      }
    });
  }
  public async CreateAdministrator(userid: number): Promise<void> {
    let user = await Users.findOneBy({ userId: userid });
    Administrator.insert({ user });
  }
  public async CreateTempData(deviceId: string, day: number, night: number) {
    let device = await Device.findOneBy({ deviceId: deviceId });
    const newData = new TemporaryData();
    newData.day = day;
    newData.night = night;
    newData.device = device;
    const errors = await validate(newData);
    if (errors.length > 0) {
      throw new Error("validation for Temporary Data failed");
    } else {
      TemporaryData.save(newData);
    }
  }
  public async CreateContactForm(
    email: string,
    message: string,
    message_topic: string
  ) {
    let newContactForm = new ContactForm();
    newContactForm.email = email;
    newContactForm.message = message;
    newContactForm.message_topic = message_topic;

    const errors = await validate(newContactForm);
    if (errors.length > 0) {
      throw new Error("validation for contactform failed");
    } else {
      await ContactForm.save(newContactForm);
    }
  }

  public async CreatePasswordReset(
    token: string,
    userId?: number,
    email?: string,
    phone?: string
  ) {
    let user: Users = await this.GetUser(userId, email, phone);
    if (!user)
      throw new Error("user to create new password reset was not found");
    const newPasswordReset = new Password_Reset();
    newPasswordReset.Token = token;
    newPasswordReset.user = user;
    console.log();
    await Password_Reset.save(newPasswordReset);
  }
  //#endregion

  //#region Get Data
  public async GetAdministrator(userId: number): Promise<Administrator> {
    let AdminQuery = AppDataSource.getRepository(Administrator)
      .createQueryBuilder("administrator")
      .innerJoinAndSelect("administrator.user", "user")
      .where("user.userid = :adminid", { adminid: userId })
      .getOne();
    return await AdminQuery;
  }

  public async GetData(
    userId: number,
    endDate?: Date,
    startDate?: Date
  ): Promise<DeviceSpecificData[]> {
    //get all devices data and temp data
    let tempdata: TemporaryData[] = await this.GetTempData(userId);
    let data: Data[] = [];
    if (endDate && startDate) {
      data = await AppDataSource.getRepository(Data)
        .createQueryBuilder("data")
        .leftJoinAndSelect("data.device", "dev")
        .where("dev.user = :id", { id: userId })
        .andWhere("data.created_at < :endDate", { endDate: endDate })
        .andWhere("data.created_at > :startDate", { startDate: startDate })
        .getMany();
    } else {
      data = await AppDataSource.getRepository(Data)
        .createQueryBuilder("data")
        .leftJoinAndSelect("data.device", "dev")
        .where("dev.user = :id", { id: userId })
        .getMany();
    }
    let devices: Device[] = await this.GetDevices(userId);
    //create array of specific complete data
    let CompleteData: DeviceSpecificData[] = [];

    //loop trough all devices
    devices.forEach(async (device) => {
      let CurrentDayData: TemporaryData = new TemporaryData();
      let filteredTempData: TemporaryData[] = tempdata.filter(
        (a) => a.device.device_index === device.device_index
      );
      if (filteredTempData.length >= 2) {
        CurrentDayData.day =
          parseInt(filteredTempData[0].day.toString()) -
          parseInt(filteredTempData.reverse()[0].day.toString());
        CurrentDayData.night =
          parseInt(filteredTempData[0].night.toString()) -
          parseInt(filteredTempData.reverse()[0].night.toString());
      } else {
        CurrentDayData = null;
        if (filteredTempData[0] && !startDate && !endDate)
          CurrentDayData = filteredTempData[0];
      }

      const deviceData: DeviceSpecificData = {
        deviceindex: device.device_index,
        deviceAlias: device.friendlyName,
        data: data.filter((a) => a.device.device_index === device.device_index),
        tempData: CurrentDayData,
      };

      CompleteData.push(deviceData);
    });

    return CompleteData;
  }
  public async GetTempData(userid: number): Promise<TemporaryData[]> {
    let alldata = await AppDataSource.getRepository(TemporaryData)
      .createQueryBuilder("temporary_data")
      .leftJoinAndSelect("temporary_data.device", "dev")
      .where("dev.user = :id", { id: userid })
      .getMany();
    return alldata;
  }

  public async GetUser(
    userid?: number,
    email?: string,
    number?: string
  ): Promise<Users> {
    return this.firstNonUndefined([
      await Users.findOne({ where: { email: Equal(email) } }),
      await Users.findOne({ where: { userId: Equal(userid) } }),
      await Users.findOne({ where: { phone: Equal(number) } }),
    ]);
  }
  private firstNonUndefined(objects: any[]): any {
    return objects.find((object) => object !== undefined && object !== null);
  }
  public async GetDevices(userid: number): Promise<Device[]> {
    let devices = await AppDataSource.getRepository(Device)
      .createQueryBuilder("device")
      .leftJoinAndSelect("device.user", "user")
      .where("user.userid = :id", { id: userid })
      .getMany();
    return devices;
  }

  public async GetLastData(
    device_index: number,
    dataid: number
  ): Promise<Data> {
    let lastTemporaryData: TemporaryData = await this.GetTempData(
      device_index
    )[0];
    const latestData: Data = new Data();
    latestData.day = lastTemporaryData.day;
    latestData.night = lastTemporaryData.night;
    latestData.device = await Device.findOneBy({ device_index: device_index });
    latestData.created_at = lastTemporaryData.created_at;
    latestData.dataId = dataid + 1;
    return latestData;
  }

  public async GetPasswordReset(token: string): Promise<boolean> {
    let resettoken: Password_Reset = await Password_Reset.findOneBy({
      Token: token,
    });
    let passwordResetAllowed: boolean =
      new Date().getTime() - resettoken.created_at.getTime() < 30 * 60 * 1000;
    this.DeleteSpecificPasswordReset(token);
    return passwordResetAllowed;
  }
  public async GetContactForm(
    message_topic?: string,
    email?: string
  ): Promise<ContactForm[]> {
    if (message_topic)
      return await ContactForm.findBy({ message_topic: message_topic });
    if (email) return await ContactForm.findBy({ email: email });
    return await ContactForm.find();
  }

  //#endregion

  //#region Edit Data

  public async ChangePassword(
    userId: number,
    newPassword: string
  ): Promise<void> {
    let User: Users = await Users.findOneBy({ userId: userId });
    User.password = newPassword;
    User.save();
    //Users.update(userId, { password: newPassword });
  }

  public async coupleUserToDevice(userid: number, deviceid: string) {
    let user = await Users.findOneBy({ userId: userid });
    await Device.update({ deviceId: deviceid }, { user: user });
  }

  public async EditDeviceAlias(deviceIndex: number, alias: string) {
    Device.update({ device_index: deviceIndex }, { friendlyName: alias });
  }

  //#endregion

  //#region Delete Data
  public async DeleteAdministrator(adminId?: number): Promise<void> {
    Administrator.delete({ adminId: adminId });
  }
  public async DeleteUser(userid: number) {
    Users.delete({ userId: userid });
  }
  public async DeleteDevice(device_index: number) {
    let device = await Device.findOneBy({ device_index: device_index });
    console.log(device.data);
  }
  //#endregion

  public async CleanTemporaryData() {
    await this.DeleteExpiredData();
    let allDevices: Device[] = await Device.find();
    allDevices.map(async (specificDevice) => {
      let dataFromSpecificDevice = await this.getAllTempData(
        specificDevice.device_index
      );
      if (dataFromSpecificDevice.length === 0) {
        dataFromSpecificDevice = dataFromSpecificDevice.sort((a, b) =>
          a.created_at > b.created_at ? 1 : -1
        );
        if (dataFromSpecificDevice.length > 1) {
          let allDayData: number[] = [];
          let allNightData: number[] = [];
          dataFromSpecificDevice.map((d) => {
            allDayData.push(d.day);
            allNightData.push(d.night);
          });
          const totalDayUsage: number = allDayData.at(-1) - allDayData.at(0);
          const totalNightUsage: number =
            allNightData.at(-1) - allNightData.at(0);
          await this.CreateData(
            specificDevice.deviceId,
            totalDayUsage,
            totalNightUsage
          );
        }
        dataFromSpecificDevice.shift();
        dataFromSpecificDevice.map(
          async (data) => await this.DeleteSpecificTempData(data.index)
        );
      }
    });
  }
  private async getAllTempData(index: number): Promise<TemporaryData[]> {
    let alldata: TemporaryData[] = await AppDataSource.getRepository(
      TemporaryData
    )
      .createQueryBuilder("temporary_data")
      .select()
      .where("deviceDeviceIndex = :deviceIndex", { deviceIndex: index })
      .getMany();
    return alldata;
  }

  public async DeleteExpiredPasswordReset() {
    const expiringDate: Date = new Date(new Date().getTime() - 2 * 60 * 1000);
    await AppDataSource.getRepository(Password_Reset).delete({
      created_at: LessThan(expiringDate),
    });
  }

  private async DeleteExpiredData() {
    const expiringDate: Date = new Date(new Date().getTime() - 10 * 60 * 1000);
    await AppDataSource.getRepository(Password_Reset).delete({
      created_at: LessThan(expiringDate),
    });
  }
  private async DeleteSpecificPasswordReset(token: string) {
    Password_Reset.delete({ Token: token });
  }
  private async DeleteSpecificTempData(index: number) {
    TemporaryData.delete({ index: index });
  }
  private ValidateObject(object: Object): Promise<boolean> {
    return validate(object).then(async (result) => {
      if (result.length > 0) {
        throw new Error("validation failed: " + result.toString());
      } else {
        return true;
      }
    });
  }
}
