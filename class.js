class CustomDateParser {
  constructor() {
    //this.nowDate = new Date();
    this.newDate = new Date();
    this.dateMatched = false;
    this.timeMatched = false;
  }

  get nowDate() {
    return new Date();
  }

  parse(userInput) {
    this.userInput = userInput;
    this.parseDayOfWeek(this.userInput);
    this.parseTagAfter(this.userInput);
    this.parseNumericMonth(this.userInput);
    this.parseNumericTime(this.userInput);

    //Matching by keywords if newDate not matched on prev methods
    if (!this.dateMatched) {
      if (this.userInput.includes('сегодня')) {
        this.newDate.setDate(this.nowDate.getDate());
        this.userInput = this.userInput.replace(/сегодня\s/g, " ");
        this.dateMatched = true;
      }
      else if (this.userInput.includes('завтра')) {
        this.newDate.setDate(this.nowDate.getDate() + 1);
        this.userInput = this.userInput.replace(/завтра\s/g, " ");
        this.dateMatched = true;
      }
      else if (this.userInput.includes('послезавтра')) {
        this.newDate.setDate(this.nowDate.getDate() + 2);
        this.userInput = this.userInput.replace(/послезавтра\s/g, " ");
        this.dateMatched = true;
      }
    }
  }
  
  //parseDayOfweek //OK
  parseDayOfWeek(userInput) {
    const weekdays = [
      "воскресенье|вс|воскресен|воскрес|вос",
      "понедельник|пн|пон|понед",
      "вторник|вт|втор",
      "среду|ср|сред|среда",
      "четверг|чт|чет|чтв",
      "пятницу|пт|пят|пятница",
      "субботу|сб|суббот|суббота"
    ];

    const regexp = new RegExp(`(?<!\\S)(?:в|во|)\\s*?(${weekdays.join("|")})(?!\\S)`, "gi");
    const matching = regexp.exec(userInput);

    if (matching === null) {
      console.log(`[parseDayOfWeek]: Not matched.`);
      return;
    }

    const matchingString = matching[0];
    const matchingWeekday = matching[1];
    const matchingWeekdayNumber = weekdays.findIndex(day => {
      const parts = day.split("|");
      return parts.some(part => matchingWeekday.includes(part));
    });

    this.userInput = this.userInput.replace(matchingString, "");
    this.newDate = this.getNextWeekday(this.nowDate, matchingWeekdayNumber);
    this.dateMatched = true;

    console.log(`[parseDayOfWeek]: MATCHED. Returned: ${this.newDate.toLocaleString()}`); 
  }

  //parseTagAfter
  parseTagAfter(userInput) {
    if (this.dateMatched || this.timeMatched)
      return;

    const regexp = new RegExp(
      `(?<!\\S)(?:через\\s)?((?:\\d{1,3})|)(?:\\s*?)(минут|минуту|минуты|час|часа|часов|день|дня|дней|месяц|месяца|месяцев|год|года|лет)(?!\\S)`,
      `gi`
    );
    //const regexp = new RegExp(`(?<!\\S)(?:через\\s)?((?:\\d{1,3})|)(?:\\s*?)((?:(?:минут)[уыае]?)|(?:(?:(?:час)(?:[а]|(?:ов))?))|(?:(?:(?:месяц)(?:[а]|(?:ев))?)))(?!\\S)`, `gi`);
    //const regexp = new RegExp(`(?<!\\S)(?:через\\s)?((?:\\d{1,3})|)(?:\\s*?)((?:(?:минут)(?:.*)?)|(?:(?:час)(?:.*)?)|(?:(?:дн)(?:.*)?)|(?:(?:месяц)(?:.*)?))(?!\\S)`, `gi`);
    //мои безуспешные попытки https://regex101.com/r/XDnVIv/2, js не поддерживает PCRE2, в частности  resed subpatern group :(

    const matching = regexp.exec(userInput);

    if (matching == null) {
      console.log(`[parseTagAfter]: Not matched.`);
      return this.newDate;
    }

    const matchingString = matching[0];
    const matchingOffsetNumber = parseInt(matching[1] === "" ? 1 : matching[1]);
    const matchingOffsetName = matching[2];

    this.userInput = this.userInput.replace(matchingString, ``);

    switch (matchingOffsetName) {
      case "минут":
      case "минуты":
      case "минуту":
        this.newDate = this.addMinutes(this.newDate, matchingOffsetNumber);
        this.timeMatched = true;
        break;
      case "час":
      case "часа":
      case "часов":
        this.newDate = this.addHours(this.newDate, matchingOffsetNumber);
        this.timeMatched = true;
        break;
      case "день":
      case "дня":
      case "дней":
        this.newDate = this.addDays(this.newDate, matchingOffsetNumber);
        this.dateMatched = true;
        break;
      case "месяц":
      case "месяца":
      case "месяцев":
        this.newDate = this.addMonth(this.newDate, matchingOffsetNumber);
        this.dateMatched = true;
        break;
      case "год":
      case "года":
      case "лет":
        this.newDate = this.addYears(this.newDate, matchingOffsetNumber);
        this.dateMatched = true;
        break;
    }

    const repeatMatching = regexp.exec(userInput);
    if (repeatMatching) {
      return this.parseTagAfter(this.userInput);
    }

    return console.log(`[parseTagAfter]: MATCHED. Returned: ${this.newDate.toLocaleString()}`);
  }

  parseNumericMonth(userInput) {
    if (this.dateMatched) {
      return;
    }

    const regexp = new RegExp(`(?<!\\S)(?:(\\d{1,2})([-\/.])(\\d{1,2}))(?!\\S)`, `gi`);
    const matching = regexp.exec(userInput);
    if (matching == null) {
      console.log(`[parseNumericMonth]: Not matched.`);
      return;
    }

    const matchingString = matching[0];
    const matchingDate = parseInt(matching[1]);
    const matchingMonth = parseInt(matching[3]);

    this.newDate.setDate(matchingDate);
    this.newDate.setMonth(matchingMonth - 1);

    if((this.newDate.getDate() === matchingDate) && (this.newDate.getMonth() + 1 === matchingMonth)) {
      if (this.newDate < this.nowDate) {
        this.newDate = this.addYears(this.newDate, 1);
      }
      this.userInput = this.userInput.replace(matchingString, ``);
      this.dateMatched = true;
      console.log(`[parseNumericMonth]: MATCHED. Returned: ${this.newDate.toLocaleString()}`);
    } 
    else {
      this.newDate = this.nowDate;
      console.log(`[parseNumericMonth]: Not matched. Something wrong with date or month.`);
    }
  }

  // parseNumericTime OK
  parseNumericTime(userInput) {
    if (this.timeMatched) {
      return;
    }

    const regexp = new RegExp(`(?<!\\S)(?:в\\s)?(?:(\\d{1,2})(?:[ :])?(\\d{1,2})?)(?!\\S)`, `gi`);
    const matching = regexp.exec(userInput);

    if (matching == null) {
      console.log(`[parseNumericTime]: Not matched.`);
      return;
    }
    let matchingString = matching[0];
    let hours = parseInt(matching[1]);
    let minutes = parseInt(matching[2] ?? 0);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.log("[parseNumericTime]: Not matched. Wrong hours or minutes.");
      return;
    }

    this.newDate.setHours(hours);
    this.newDate.setMinutes(minutes);

    if (this.newDate < this.nowDate) {
      this.newDate = this.addDays(this.newDate, 1);
    }

    this.userInput = this.userInput.replace(matchingString, "");
    console.log(`[parseNumericTime]: MATCHED. Returned: ${this.newDate.toLocaleString()}`);
  }

  //change date/time methods
  getNextWeekday(date, weekday) {
    const result = new Date(date);
    result.setDate(date.getDate() + ((7 + weekday - date.getDay()) % 7));
    return result;
  }

  addMinutes(date, minutes) {
    const result = new Date(date);
    result.setTime(result.getTime() + minutes * 60000);
    return result;
  }

  addHours(date, hours) {
    const result = new Date(date);
    result.setTime(result.getTime() + hours * 3600000);
    return result;
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addMonth(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }
}

const parser = new CustomDateParser();
parser.parse(`напомни В 12:1 завтра к стоматологу`);
console.log(parser.newDate.toLocaleString());
console.log(parser.userInput.replace(/напомни\s{2,}/g, " "));



