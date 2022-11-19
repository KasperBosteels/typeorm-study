import { Administrator } from "./entity/Administrator";
import { Data } from "./entity/Data";
import { Colors, Users } from "./entity/User";
import { Device } from "./entity/Device";
import { AppDataSource } from "./data-source";
import { TemporaryData } from "./entity/TemporaryData";
import { Password_Reset } from "./entity/Password_Reset";
import { Equal, LessThan } from "typeorm";
import { ContactForm } from "./entity/contact";
import { validate } from "class-validator";
import { weeklyData } from "./entity/weekly_data";
interface DeviceSpecificData {
  deviceindex: number;
  deviceAlias: string;
  data: Data[];
  tempData: TemporaryData;
}
export class DataProcessor {
  //#region Create Data
 
 /**
  * creates a device in the database
  * @param DeviceId string id of device(64 char)
  * @param alias string | undefined alias of device
  */
  public async CreateDevice(DeviceId: string, alias?: string) {
    const newDevice = new Device();
    newDevice.deviceId = DeviceId;
    if (alias) newDevice.friendlyName = alias;

    if (await this.ValidateObject(newDevice)) {
      await Device.save(newDevice);
    }
  }

  /**
   * creates a user in the database
   * @param firstname string
   * @param lastname string
   * @param email string valid email adress
   * @param password string min 5 char
   * @param phoneNUmber string valid belgian number
   * @returns promise voide
   */
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

  /**
   * creates Data in database
   * @param deviceid string device id (64 char)
   * @param dataDay number | undefined
   * @param DataNight number | undefined
   * @param date Date | undefined
   */
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

  /**
   * creates a new admin connected to a user.
   * @param userid user id number
   */
  public async CreateAdministrator(userid: number): Promise<void> {
    let user = await Users.findOneBy({ userId: userid });
    Administrator.insert({ user });
  }

  /**
   * creates new TemporaryData in database
   * @param deviceId string device id (64 char)
   * @param day number | undefined
   * @param night number | undefined
   * @param date Date | undefined
   */
  public async CreateTempData(
    deviceId: string,
    day: number,
    night: number,
    date?: Date
  ) {
    let device = await Device.findOneBy({ deviceId: deviceId });
    const newData = new TemporaryData();
    newData.day = day;
    newData.night = night;
    newData.device = device;
    //for debugging i added date
    if (date) newData.created_at = date;
    const errors = await validate(newData);
    if (errors.length > 0) {
      throw new Error("validation for Temporary Data failed");
    } else {
      TemporaryData.save(newData);
    }
  }

  /**
   * creates a new ContactForm in database
   * @param email string valid email adress
   * @param message string 
   * @param message_topic string 
   */
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

  /**
   * creates a password reset entry in database
   * @param token strong supposed to be a unique token that the user has
   * @param userId number user index
   * @param email string valid email adress
   * @param phone string valid belgian phone number
   */
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

  /**
   * returns administrator object if it exists
   * @param userId number user index
   * @returns Promise<Administrator>
   */
  public async GetAdministrator(userId: number): Promise<Administrator> {
    let AdminQuery = AppDataSource.getRepository(Administrator)
      .createQueryBuilder("administrator")
      .innerJoinAndSelect("administrator.user", "user")
      .where("user.userid = :adminid", { adminid: userId })
      .getOne();
    return await AdminQuery;
  }
  /**
   * returns DeviceSpecificData[] of a specific user within given dates if any
   * @param userId number user index
   * @param endDate Date | undefined
   * @param startDate  Date | undefined
   * @returns Promise<DeviceSpecificData[]>
   */
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
  /**
   * gets temp data from all devices of a specific user
   * @param userid user index
   * @returns Promise<TemporaryData[]>
   */
  public async GetTempData(userid: number): Promise<TemporaryData[]> {
    let alldata = await AppDataSource.getRepository(TemporaryData)
      .createQueryBuilder("temporary_data")
      .leftJoinAndSelect("temporary_data.device", "dev")
      .where("dev.user = :id", { id: userid })
      .getMany();
    return alldata;
  }
  /**
   * return a User if any found
   * @param userid number user index
   * @param email string valid email adress
   * @param number string valid belgian phone number
   * @returns Promise<User>
   */
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
  /**
   * finds first not undefined value in an array of objects
   * @param objects any[] array of objects it needs to filter
   * @returns any
   */
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

  /**
   * gets last TemporaryData id of a specific device
   * @param device_index number device index
   * @param dataid 
   * @returns Promise<TemporaryData>
   */
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
  /**
   * checks if the token is still valid, in both cases it will delete the token.
   * @param token string unique token
   * @returns Promise<boolean>
   */
  public async GetPasswordReset(token: string): Promise<boolean> {
    let resettoken: Password_Reset = await Password_Reset.findOneBy({
      Token: token,
    });
    let passwordResetAllowed: boolean =
      new Date().getTime() - resettoken.created_at.getTime() < 30 * 60 * 1000;
    this.DeleteSpecificPasswordReset(token);
    return passwordResetAllowed;
  }
  /**
   * searches in contactform table for forms with or without filtering on topic or email adress.
   * @param message_topic string | undefinde topic of the form
   * @param email string | undefined email adress of the form submitter
   * @returns Promise<ContactForm[]>
   */
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
  /**
   * changes the password of a user
   * @param userId number user index
   * @param newPassword string (min 5 char)
   */
  public async ChangePassword(
    userId: number,
    newPassword: string
  ): Promise<void> {
    let User: Users = await Users.findOneBy({ userId: userId });
    User.password = newPassword;
    User.save();
    //Users.update(userId, { password: newPassword });
  }
  /**
   * makes a relation with a specific user to a device
   * @param userid 	number user index
   * @param deviceid string device id (64 char)
   */
  public async coupleUserToDevice(userid: number, deviceid: string) {
    let user = await Users.findOneBy({ userId: userid });
    await Device.update({ deviceId: deviceid }, { user: user });
  }
  /**
   * adds a custom name to the device 
   * @param deviceIndex number device index
   * @param alias string extra name for the device (min 1 char)
   */
  public async EditDeviceAlias(deviceIndex: number, alias: string) {
    Device.update({ device_index: deviceIndex }, { friendlyName: alias });
  }

  /**
   * Edit a single account with the given data
   * @param userid number index of user
   * @param firstname string | undefined name
   * @param lastname string | undefined last name
   * @param email string | undefined valid email
   * @param phone string | undefined valid belgian phone number
   * @param colorDay Colors | undefined enum of colors
   * @param colorNight Colors | undefined enum of colors
   */
  public async EditAccount(userid:number,firstname:string,lastname:string,email:string,phone:string,colorDay:Colors,colorNight:Colors):Promise<void>{
    let userCountifexist :[Users[],number] = await Users.findAndCountBy({userId:userid});
    if(userCountifexist[1] <1){

    }else{
      await Users.update({userId:userid},{
        firstname:firstname,
        lastname:lastname,
        email:email,
        phone:phone,
        colorDay:colorDay,
        colorNight:colorNight
      });
    }

  }

  //#endregion

  //#region Delete Data

  /**
   * removes an admin from the database
   * @param adminId admin index
   */
  public async DeleteAdministrator(adminId?: number): Promise<void> {
    Administrator.delete({ adminId: adminId });
  }
  /**
   * deletes a user from the database
   * @param userid number user index
   */
  public async DeleteUser(userid: number) {
    Users.delete({ userId: userid });
  }
  /**
   * removes a device from the database
   * @param device_index device index
   */
  public async DeleteDevice(device_index: number) {
    let device = await Device.findOneBy({ device_index: device_index });
    console.log(device.data);
  }
  //#endregion
  /**
   * ° removes data older than 24 hours.
   * ° creates data by subtracting the last off the first temp data for each device.
   * ° removes all temporaryData used in creating new data except for the last entry 
   */
  public async CleanTemporaryData() {
    await this.DeleteExpiredData();
    let allDevices: Device[] = await Device.find();
    allDevices.map(async (specificDevice,index) => {
      setTimeout(async ()=>{
        let dataFromSpecificDevice = await this.getAllTempData(
         specificDevice.device_index
        );
        if (dataFromSpecificDevice.length > 0) {
         dataFromSpecificDevice = dataFromSpecificDevice.sort((a, b) =>
            a.created_at < b.created_at ? 1 : -1
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
      console.log("cleaned all temp data from ",specificDevice.deviceId)
      },1_000 * (index+1));
    });
  
  }
  /**
   * returns all TemporaryData from the database
   * @param index number
   * @returns Promise<TemporaryData[]>
   */
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

  /**
   * deletes any password reset tokens older than 30 minutes
   */
  public async DeleteExpiredPasswordReset() {
    const expiringDate: Date = new Date(new Date().getTime() - 30 * 60 * 1000);
    await AppDataSource.getRepository(Password_Reset).delete({
      created_at: LessThan(expiringDate),
    });
  }

  /**
   * looks for any data between two dates
   * @param tempData TemporaryData[]
   * @param startWeek Date
   * @param endWeek Date
   */
  private async weeklyData(tempData:TemporaryData[],startWeek:Date,endWeek:Date){
  const filteredData:TemporaryData[] = tempData.filter((a)=>a.created_at>=startWeek && a.created_at < endWeek).sort((a,b)=>a.created_at<b.created_at?1:-1)
  if(filteredData.length<=1){
    return;
  }else if(filteredData.length>1){

  }
  }
  /**
   * deletes any TemporaryData older than 24 hours
   */
  private async DeleteExpiredData() {
    const expiringDate: Date = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    await AppDataSource.getRepository(TemporaryData).delete({
      created_at: LessThan(expiringDate),
    });
  }
  /**
   * deletes a single password reset entry in database
   * @param token string unique token
   */
  private async DeleteSpecificPasswordReset(token: string) {
    Password_Reset.delete({ Token: token });
  }
  /**
   * deletes a single TemporaryData entry in database
   * @param index TemporaryData index
   */
  private async DeleteSpecificTempData(index: number) {
    TemporaryData.delete({ index: index });
  }
  /**
   * does not work
   * validates any typeorm entitiy that needs to be inserted in database.
   * returns true if validation passed
   * if validation fails it throws an error
   * @param object Object
   * @returns Promise<boolean>
   */
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
