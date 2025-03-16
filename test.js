const separate1 = [
  {
    From: "Bahaddarhat Moar",
    To: "Chawkbazar KachaBazar",
    Vehicle: "Bus No.1",
    distance: 1.4,
    used: false,
  },
  {
    From: "Bahaddarhat Moar",
    To: "Chawkbazar KachaBazar",
    Vehicle: "Tempu",
    distance: 1.4,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Parade Corner",
    Vehicle: "Tomtom",
    distance: 0.15,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Parade Corner",
    Vehicle: "Tempu",
    distance: 0.15,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Parade Corner",
    Vehicle: "Bus No.1",
    distance: 0.15,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Parade Corner",
    Vehicle: "Walk",
    distance: 0.15,
    used: false,
  },
  {
    From: "Parade Corner",
    To: "Keyari",
    Vehicle: "Walk",
    distance: 0.1,
    used: false,
  },
  {
    From: "Keyari",
    To: "Hazi Mohammad Mohsin College Gate",
    Vehicle: "Mini Truck",
    distance: 0.5,
    used: false,
  },
  {
    From: "Keyari",
    To: "Hazi Mohammad Mohsin College Gate",
    Vehicle: "Tempu",
    distance: 0.5,
    used: false,
  },
  {
    From: "Hazi Mohammad Mohsin College Gate",
    To: "Gani Bakery",
    Vehicle: "Tempu",
    distance: 0.12,
    used: false,
  },
  {
    From: "Hazi Mohammad Mohsin College Gate",
    To: "Gani Bakery",
    Vehicle: "Mini Truck",
    distance: 0.12,
    used: false,
  },
  {
    From: "Gani Bakery",
    To: "Jamal Khan Circle",
    Vehicle: "Tempu",
    distance: 0.45,
    used: false,
  },
  {
    From: "Gani Bakery",
    To: "Jamal Khan Circle",
    Vehicle: "Mini Truck",
    distance: 0.45,
    used: false,
  },
  {
    From: "Jamal Khan Circle",
    To: "Cheragi Pahar More",
    Vehicle: "Walk",
    distance: 0.5,
    used: false,
  },
  {
    From: "Jamal Khan Circle",
    To: "Cheragi Pahar More",
    Vehicle: "Rikshaw",
    distance: 0.5,
    used: false,
  },
  {
    From: "Cheragi Pahar More",
    To: "Andarkilla",
    Vehicle: "Walk",
    distance: 0.35,
    used: false,
  },
  {
    From: "Cheragi Pahar More",
    To: "Andarkilla",
    Vehicle: "Rikshaw",
    distance: 0.35,
    used: false,
  },
];

const merged1 = [
  {
    From: "Bahaddarhat Moar",
    To: "Parade Corner",
    Vehicle: "Bus No.1",
    distance: 1.5499999999999998,
    fare: 5,
    used: false,
  },
  {
    From: "Bahaddarhat Moar",
    To: "Parade Corner",
    Vehicle: "Tempu",
    distance: 1.5499999999999998,
    fare: 6,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Parade Corner",
    Vehicle: "Tomtom",
    distance: 0.15,
    fare: 5,
    used: false,
  },
  {
    From: "Chawkbazar KachaBazar",
    To: "Keyari",
    Vehicle: "Walk",
    distance: 0.25,
    fare: 0,
    used: false,
  },
  {
    From: "Keyari",
    To: "Jamal Khan Circle",
    Vehicle: "Mini Truck",
    distance: 1.07,
    fare: 5,
    used: false,
  },
  {
    From: "Keyari",
    To: "Jamal Khan Circle",
    Vehicle: "Tempu",
    distance: 1.07,
    fare: 5,
    used: false,
  },
  {
    From: "Jamal Khan Circle",
    To: "Andarkilla",
    Vehicle: "Walk",
    distance: 0.85,
    fare: 0,
    used: false,
  },
  {
    From: "Jamal Khan Circle",
    To: "Andarkilla",
    Vehicle: "Rikshaw",
    distance: 0.85,
    fare: 25,
    used: false,
  },
];

const res1 = [
  [
    {
      From: "Bahaddarhat Moar",
      To: "Parade Corner",
      Vehicle: "Bus No.1",
      distance: 1.5499999999999998,
      fare: 5,
      used: false,
    },
    {
      From: "Bahaddarhat Moar",
      To: "Parade Corner",
      Vehicle: "Tempu",
      distance: 1.5499999999999998,
      fare: 6,
      used: false,
    },
  ],
  [
    {
      From: "Chawkbazar KachaBazar",
      To: "Keyari",
      Vehicle: "Walk",
      distance: 0.25,
      fare: 0,
      used: false,
    },
    {
      From: "Bahaddarhat Moar",
      To: "Chawkbazar KachaBazar",
      Vehicle: "Bus No.1",
      distance: 1.4,
      used: false,
    },
    {
      From: "Keyari",
      To: "Jamal Khan Circle",
      Vehicle: "Mini Truck",
      distance: 1.07,
      fare: 5,
      used: false,
    },
    {
      From: "Keyari",
      To: "Jamal Khan Circle",
      Vehicle: "Tempu",
      distance: 1.07,
      fare: 5,
      used: false,
    },
    {
      From: "Jamal Khan Circle",
      To: "Andarkilla",
      Vehicle: "Walk",
      distance: 0.85,
      fare: 0,
      used: false,
    },
    {
      From: "Jamal Khan Circle",
      To: "Andarkilla",
      Vehicle: "Rikshaw",
      distance: 0.85,
      fare: 25,
      used: false,
    },
  ],
];
const separate2 = [
  {
    From: "Patenga Sea Beach",
    To: "Katgar Moar",
    Vehicle: "Bus No.10",
    distance: 2.4,
    used: false,
  },
  {
    From: "Patenga Sea Beach",
    To: "Katgar Moar",
    Vehicle: "Bus No.6",
    distance: 2.4,
    used: false,
  },
  {
    From: "Patenga Sea Beach",
    To: "Katgar Moar",
    Vehicle: "Bus No.11",
    distance: 2.4,
    used: false,
  },
  {
    From: "Katgar Moar",
    To: "Cement Crossing",
    Vehicle: "Bus No.10",
    distance: 2.2,
    used: false,
  },
  {
    From: "Katgar Moar",
    To: "Cement Crossing",
    Vehicle: "Bus No.6",
    distance: 2.2,
    used: false,
  },
  {
    From: "Katgar Moar",
    To: "Cement Crossing",
    Vehicle: "Bus No.11",
    distance: 2.2,
    used: false,
  },
  {
    From: "Cement Crossing",
    To: "Free-Port",
    Vehicle: "Bus No.10",
    distance: 1.7,
    used: false,
  },
  {
    From: "Cement Crossing",
    To: "Free-Port",
    Vehicle: "Bus No.6",
    distance: 1.7,
    used: false,
  },
  {
    From: "Cement Crossing",
    To: "Free-Port",
    Vehicle: "Mini Truck",
    distance: 1.7,
    used: false,
  },
  {
    From: "Cement Crossing",
    To: "Free-Port",
    Vehicle: "Bus No.11",
    distance: 1.7,
    used: false,
  },
  {
    From: "Free-Port",
    To: "Salt Gola Crossing",
    Vehicle: "Bus No.10",
    distance: 1.5,
    used: false,
  },
  {
    From: "Free-Port",
    To: "Salt Gola Crossing",
    Vehicle: "Bus No.6",
    distance: 1.5,
    used: false,
  },
  {
    From: "Free-Port",
    To: "Salt Gola Crossing",
    Vehicle: "Bus No.11",
    distance: 1.5,
    used: false,
  },
  {
    From: "Salt Gola Crossing",
    To: "Custom House",
    Vehicle: "Bus No.10",
    distance: 1.3,
    used: false,
  },
  {
    From: "Salt Gola Crossing",
    To: "Custom House",
    Vehicle: "Bus No.6",
    distance: 1.3,
    used: false,
  },
  {
    From: "Salt Gola Crossing",
    To: "Custom House",
    Vehicle: "Bus No.11",
    distance: 1.3,
    used: false,
  },
  {
    From: "Custom House",
    To: "Nimtola",
    Vehicle: "Bus No.10",
    distance: 0.3,
    used: false,
  },
  {
    From: "Custom House",
    To: "Nimtola",
    Vehicle: "Bus No.6",
    distance: 0.3,
    used: false,
  },
  {
    From: "Custom House",
    To: "Nimtola",
    Vehicle: "Bus No.11",
    distance: 0.3,
    used: false,
  },
  {
    From: "Nimtola",
    To: "Boropole",
    Vehicle: "Mahindra No.11",
    distance: 2.2,
    used: false,
  },
  {
    From: "Nimtola",
    To: "Boropole",
    Vehicle: "Bus No.11",
    distance: 2.2,
    used: false,
  },
  {
    From: "Boropole",
    To: "Noya Bazar",
    Vehicle: "Mahindra No.11",
    distance: 1.7,
    used: false,
  },
  {
    From: "Boropole",
    To: "Noya Bazar",
    Vehicle: "Bus No.11",
    distance: 1.7,
    used: false,
  },
  {
    From: "Noya Bazar",
    To: "Sharaipara",
    Vehicle: "Mahindra No.11",
    distance: 0.65,
    used: false,
  },
  {
    From: "Noya Bazar",
    To: "Sharaipara",
    Vehicle: "Bus No.11",
    distance: 0.65,
    used: false,
  },
  {
    From: "Sharaipara",
    To: "Alongkar Mor",
    Vehicle: "Mahindra No.11",
    distance: 1.1,
    used: false,
  },
  {
    From: "Sharaipara",
    To: "Alongkar Mor",
    Vehicle: "Bus No.11",
    distance: 1.1,
    used: false,
  },
  {
    From: "Alongkar Mor",
    To: "AK Khan",
    Vehicle: "Mahindra No.11",
    distance: 0.45,
    used: false,
  },
  {
    From: "Alongkar Mor",
    To: "AK Khan",
    Vehicle: "Bus No.11",
    distance: 0.45,
    used: false,
  },
  {
    From: "AK Khan",
    To: "Colonel Hat",
    Vehicle: "Bus No.7",
    distance: 0.75,
    used: false,
  },
  {
    From: "AK Khan",
    To: "Colonel Hat",
    Vehicle: "Bus No.8",
    distance: 0.75,
    used: false,
  },
  {
    From: "Colonel Hat",
    To: "CDA No 1",
    Vehicle: "Bus No.7",
    distance: 0.45,
    used: false,
  },
  {
    From: "Colonel Hat",
    To: "CDA No 1",
    Vehicle: "Bus No.8",
    distance: 0.45,
    used: false,
  },
  {
    From: "CDA No 1",
    To: "City Gate",
    Vehicle: "Bus No.7",
    distance: 0.3,
    used: false,
  },
  {
    From: "CDA No 1",
    To: "City Gate",
    Vehicle: "Bus No.8",
    distance: 0.3,
    used: false,
  },
  {
    From: "City Gate",
    To: "Pakka Rastar Matha",
    Vehicle: "Bus No.7",
    distance: 1.1,
    used: false,
  },
  {
    From: "City Gate",
    To: "Pakka Rastar Matha",
    Vehicle: "Bus No.8",
    distance: 1.1,
    used: false,
  },
  {
    From: "Pakka Rastar Matha",
    To: "Fakirhat",
    Vehicle: "Bus No.7",
    distance: 0.75,
    used: false,
  },
  {
    From: "Pakka Rastar Matha",
    To: "Fakirhat",
    Vehicle: "Bus No.8",
    distance: 0.75,
    used: false,
  },
  {
    From: "Fakirhat",
    To: "Bayezid Link Rd West",
    Vehicle: "Bus No.7",
    distance: 0.75,
    used: false,
  },
  {
    From: "Fakirhat",
    To: "Bayezid Link Rd West",
    Vehicle: "Bus No.8",
    distance: 0.75,
    used: false,
  },
  {
    From: "Bayezid Link Rd West",
    To: "Faujdarhat",
    Vehicle: "Bus No.7",
    distance: 1.2,
    used: false,
  },
  {
    From: "Bayezid Link Rd West",
    To: "Faujdarhat",
    Vehicle: "Bus No.8",
    distance: 1.2,
    used: false,
  },
  {
    From: "Faujdarhat",
    To: "Jalil Textile",
    Vehicle: "Bus No.7",
    distance: 0.7,
    used: false,
  },
  {
    From: "Faujdarhat",
    To: "Jalil Textile",
    Vehicle: "Bus No.8",
    distance: 0.7,
    used: false,
  },
  {
    From: "Jalil Textile",
    To: "Bhatiari",
    Vehicle: "Bus No.7",
    distance: 2,
    used: false,
  },
  {
    From: "Jalil Textile",
    To: "Bhatiari",
    Vehicle: "Bus No.8",
    distance: 2,
    used: false,
  },
  {
    From: "Bhatiari",
    To: "Chairman Ghata",
    Vehicle: "Bus No.7",
    distance: 1.4,
    used: false,
  },
  {
    From: "Bhatiari",
    To: "Chairman Ghata",
    Vehicle: "Bus No.8",
    distance: 1.4,
    used: false,
  },
  {
    From: "Chairman Ghata",
    To: "Kadam Rasul",
    Vehicle: "Bus No.7",
    distance: 1.1,
    used: false,
  },
  {
    From: "Chairman Ghata",
    To: "Kadam Rasul",
    Vehicle: "Bus No.8",
    distance: 1.1,
    used: false,
  },
  {
    From: "Kadam Rasul",
    To: "Tetul Tola",
    Vehicle: "Bus No.7",
    distance: 1.6,
    used: false,
  },
  {
    From: "Kadam Rasul",
    To: "Tetul Tola",
    Vehicle: "Bus No.8",
    distance: 1.6,
    used: false,
  },
  {
    From: "Tetul Tola",
    To: "Shitolpur",
    Vehicle: "Bus No.7",
    distance: 1,
    used: false,
  },
  {
    From: "Tetul Tola",
    To: "Shitolpur",
    Vehicle: "Bus No.8",
    distance: 1,
    used: false,
  },
  {
    From: "Shitolpur",
    To: "Barowalia",
    Vehicle: "Bus No.7",
    distance: 1.5,
    used: false,
  },
  {
    From: "Shitolpur",
    To: "Barowalia",
    Vehicle: "Bus No.8",
    distance: 1.5,
    used: false,
  },
  {
    From: "Barowalia",
    To: "IIUC Gate",
    Vehicle: "Bus No.7",
    distance: 1.6,
    used: false,
  },
  {
    From: "Barowalia",
    To: "IIUC Gate",
    Vehicle: "Bus No.8",
    distance: 1.6,
    used: false,
  },
];
const merged2 = [
  {
    From: "Patenga Sea Beach",
    To: "Nimtola",
    Vehicle: "Bus No.10",
    distance: 9.4,
    fare: 29,
    used: false,
  },
  {
    From: "Patenga Sea Beach",
    To: "Nimtola",
    Vehicle: "Bus No.6",
    distance: 9.4,
    fare: 29,
    used: false,
  },
  {
    From: "Patenga Sea Beach",
    To: "AK Khan",
    Vehicle: "Bus No.11",
    distance: 15.5,
    fare: 47,
    used: false,
  },
  {
    From: "Cement Crossing",
    To: "Free-Port",
    Vehicle: "Mini Truck",
    distance: 1.7,
    fare: 7,
    used: false,
  },
  {
    From: "Nimtola",
    To: "AK Khan",
    Vehicle: "Mahindra No.11",
    distance: 6.1000000000000005,
    fare: 24,
    used: false,
  },
  {
    From: "AK Khan",
    To: "IIUC Gate",
    Vehicle: "Bus No.7",
    distance: 16.2,
    fare: 49,
    used: false,
  },
  {
    From: "AK Khan",
    To: "IIUC Gate",
    Vehicle: "Bus No.8",
    distance: 16.2,
    fare: 49,
    used: false,
  },
];
const res2 = [
  [
    {
      From: "Patenga Sea Beach",
      To: "AK Khan",
      Vehicle: "Bus No.11",
      distance: 15.5,
      fare: 47,
      used: false,
    },
    {
      From: "AK Khan",
      To: "IIUC Gate",
      Vehicle: "Bus No.7",
      distance: 16.2,
      fare: 49,
      used: false,
    },
    {
      From: "AK Khan",
      To: "IIUC Gate",
      Vehicle: "Bus No.8",
      distance: 16.2,
      fare: 49,
      used: false,
    },
  ],
  [
    {
      From: "Patenga Sea Beach",
      To: "Nimtola",
      Vehicle: "Bus No.10",
      distance: 9.4,
      fare: 29,
      used: false,
    },
    {
      From: "Nimtola",
      To: "AK Khan",
      Vehicle: "Mahindra No.11",
      distance: 6.1000000000000005,
      fare: 24,
      used: false,
    },
    {
      From: "AK Khan",
      To: "IIUC Gate",
      Vehicle: "Bus No.7",
      distance: 16.2,
      fare: 49,
      used: false,
    },
    {
      From: "AK Khan",
      To: "IIUC Gate",
      Vehicle: "Bus No.8",
      distance: 16.2,
      fare: 49,
      used: false,
    },
  ],
];

const combination = (separate, merged, From, To) => {
  merged.sort((a, b) => b.distance - a.distance);
  const comb = [];

  const Frontadder = (doc) => {
    let currentDoc = doc;
    const temp2 = [];
    while (currentDoc && currentDoc.From !== From) {
      let temp = merged
        .filter((item) => item.To === currentDoc.From)
        .sort((a, b) => b.distance - a.distance);

      if (temp.length === 0) {
        temp = separate
          .filter((item) => item.To === currentDoc.From)
          .sort((a, b) => b.distance - a.distance);
      }
      if (temp.length === 0) break;
      temp2.push(temp[0]);
      const checkAgain = merged.filter(
        (item) =>
          item.From === temp[0].From &&
          item.To === temp[0].To &&
          item.Vehicle !== temp[0].Vehicle
      );
      temp2.push(...checkAgain);
      currentDoc = temp[0];
    }
    return temp2;
  };
  const Backadder = (doc) => {
    let currentDoc = doc;
    const temp2 = [];
    while (currentDoc && currentDoc.To !== To) {
      let temp = merged
        .filter((item) => item.From === currentDoc.To)
        .sort((a, b) => b.distance - a.distance);
      if (temp.length === 0) {
        temp = separate
          .filter((item) => item.To === currentDoc.From)
          .sort((a, b) => b.distance - a.distance);
      }
      if (temp.length === 0) break;
      temp2.push(temp[0]);
      const checkAgain = merged.filter(
        (item) =>
          item.From === temp[0].From &&
          item.To === temp[0].To &&
          item.Vehicle !== temp[0].Vehicle
      );
      temp2.push(...checkAgain);
      currentDoc = temp[0];
    }
    return temp2;
  };
  const chainer = (arr) => {
    const temp2 = [];
    const starter = arr.filter((item) => item.From === From);
    temp2.push(...starter);
    let currentDoc = starter[0];
    while (currentDoc && currentDoc.To !== To) {
      const temp = arr.filter((item) => item.From === currentDoc.To);
      temp2.push(...temp);
      currentDoc = temp[0];
    }
    return temp2;
  };
  let j = 0;
  for (let i = 0; i < merged.length; i++) {
    if (j === 2) break;
    const temp = [];
    const similer = merged.filter(
      (item) =>
        item.From === merged[i].From &&
        item.To === merged[i].To &&
        item.Vehicle !== merged[i].Vehicle
    );
    temp.push(merged[i]);
    temp.push(...similer);
    i += similer.length;
    const r1 = Frontadder(merged[i]);
    temp.unshift(...r1);
    const r2 = Backadder(merged[i]);
    temp.push(...r2);

    const exists = comb.some((existingComb) =>
      temp.every((item) =>
        existingComb.some(
          (existingItem) =>
            existingItem.From === item.From &&
            existingItem.To === item.To &&
            existingItem.Vehicle === item.Vehicle
        )
      )
    );
    if (!exists) {
      const temp2 = chainer(temp);
      comb.push(temp2);
      j++;
    }
  }

  return comb;
};
