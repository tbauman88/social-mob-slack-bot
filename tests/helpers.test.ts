import { convertTime12to24 } from "../helpers";
import * as moment from "moment";

describe("convertTime12to24", () => {
  it.each([
    ["12:00 pm"],
    ["12:30 pm"],
    ["03:15 pm"],
    ["03:30 pm"],
    ["03:45 pm"]
  ])("converts 12-hour format (%s) to 24-hour correctly", (time: string) => {
    const currentDay = moment().format("YYYY-MM-DD");

    const actualUnix = convertTime12to24(currentDay, time);
    const actualTime = moment.unix(actualUnix).format("hh:mm a");

    expect(actualTime).toBe(time);
  });
});
