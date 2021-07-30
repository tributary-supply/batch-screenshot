const testData = [
  {
    asin: 'B07GF4ZR17',
    price: '$25.32',
    buyBox: 'yes',
    shipsFrom: 'yes',
    availability: 'In Stock.',
    category: 'Hinges',
    title: 'Amazon Basics Rounded 3.5 Inch x 3.5 Inch Door Hinges, 18 Pack, Matte Black',
    altImages: 5,
    images: 'https://images-na.ssl-images-amazon.com/images/I/51cRc6otPZL._AC_SY355_PIbundle-18,TopRight,0,0_SH20_.jpg',
    aPlusContent: 'yes',
    bulletCount: 5,
    features: [
      '\n Make sure this fits\nby entering your model number.\n\n',
      'Durable steel construction',
      'Pack includes 18 total hinges',
      'Mounting hardware included',
      'Detailed installation instructions included',
      'Backed by an Amazon Basics 1-year limited warranty'
    ],
    ratingCount: '7,899 ratings',
    reviewCount: '702',
    stars: '4.8',
    style: 'Matte Black',
    byLine: 'Visit the Amazon Basics Store',
    origAsin: 'B07GF4ZR17'
  },
  {
    asin: 'B07GDXCPGD',
    price: '$25.32',
    buyBox: 'yes',
    shipsFrom: 'yes',
    availability: 'In Stock.',
    category: 'Hinges',
    title: 'Amazon Basics Rounded 3.5 Inch x 3.5 Inch Door Hinges, 18 Pack, Oil Rubbed Bronze',
    altImages: 5,
    images: 'https://images-na.ssl-images-amazon.com/images/I/61NqXjGQrrL._AC_SY355_PIbundle-18,TopRight,0,0_SH20_.jpg',
    aPlusContent: 'yes',
    bulletCount: 5,
    features: [
      '\n Make sure this fits\nby entering your model number.\n\n',
      'Durable steel construction',
      'Pack includes 18 total hinges',
      'Mounting hardware included',
      'Detailed installation instructions included',
      'Backed by an Amazon Basics 1-year limited warranty'
    ],
    ratingCount: '7,899 ratings',
    reviewCount: '702',
    stars: '4.8',
    style: 'Oil-Rubbed Bronze',
    byLine: 'Visit the Amazon Basics Store',
    origAsin: 'B07GDXCPGD'
  },
  {
    asin: 'B01MUCW80B',
    price: '$33.57',
    buyBox: 'yes',
    shipsFrom: 'yes',
    availability: 'In Stock.',
    category: 'Pulls',
    title: 'Amazon Basics Euro Bar Cabinet Handle (1/2-inch Diameter), 5.38-inch Length (3-inch Hole Center), Satin Nickel, 25-Pack',
    altImages: 5,
    images: 'https://images-na.ssl-images-amazon.com/images/I/61xR2xnMWvL._AC_SY355_.jpg',
    aPlusContent: 'yes',
    bulletCount: 2,
    features: [
      '\n Make sure this fits\nby entering your model number.\n\n',
      'Projection: 1.38-inch',
      'Fits most cabinets; includes 1-inch & 1.5-inch mounting screws; you may need to purchase screws of additional length depending on your cabinet’s width; machine screw metric size: M8-32.'
    ],
    ratingCount: '10,480 ratings',
    reviewCount: '2,803',
    stars: '4.8',
    style: 'Satin Nickel',
    byLine: 'Visit the Amazon Basics Store',
    origAsin: 'B01MUCW80B'
  }
]

const asinsWithCompetitors = [
  'B07GF4ZR17',
  'B07GDXCPGD',
  // 'B01MUCW80B',
  // 'B0775YFK3P',
]

const asins = [
  'B07GF4ZR17', 
  'B07GDXCPGD', 
  'B01MUCW80B', 
  'B0775YFK3P', 
  'B07767WNWT', 
  'B07GF5FTM5', 
  'B07GF58FQ3', 
  'B07GF5F3H6', 
  'B07GDWYXJK', 
  'B07GF7VNMZ', 
  'B01N24KKWK', 
  'B07GDQLV3G', 
  'B01MR894RT', 
  'B01N5RJL3B', 
  'B07767BJG4', 
  'B079L9X9M4', 
  'B07GF54KV8', 
  'B079L6LY25', 
  'B07PJTYNC7', 
  'B07763W5NX', 
  'B07GF4X7WC', 
  'B07GDWZFLL', 
  'B0775ZBQZT', 
  'B07GF9P3FY', 
  'B01MYAGID4', 
  'B0775XKM8R', 
  'B01MTB9T2P', 
  'B07763RB3V', 
  'B01MS9NU4J', 
  'B01MS9NV9T', 
  'B0775YFK36', 
  'B073WGN8DW', 
  'B01MTB9W7E', 
  'B01MR892S8', 
  'B079L7MXTK', 
  'B01N4Q81F7', 
  'B07GF4X7QG', 
  'B01MZC15J5', 
  'B01MYAGE6W', 
  'B01N24KI7Y', 
  'B0775ZMBDX', 
  'B07GDS15KG', 
  'B07GDWV5WT', 
  'B07762NXPM', 
  'B01N24KM9U', 
  'B07GDWYZ3H', 
  'B01MS9NT4M', 
  'B07GF9P3GL', 
  'B01MS9NU0O', 
  'B073WFL878', 
  'B07GDWYYX2', 
  'B07GF4X7TR', 
  'B01MYAGERU', 
  'B07GFFLGH5', 
  'B07GF5F3HZ', 
  'B07GF583NX', 
  'B07GDRZXSS', 
  'B0776C21Z8', 
  'B07765Z6S4', 
  'B01MR892ED', 
  'B079L9X9L4', 
  'B079L6LY1V', 
  'B01MTBA4V3', 
  'B01MYAGGST', 
  'B07763QC7R', 
  'B07GDWV53C', 
  'B07PHPSK3C', 
  'B07GF54QVJ', 
  'B07GDQLV46', 
  'B01N7UFZIN', 
  'B01MS9NPGA', 
  'B07GF5F9DF', 
  'B01NBWTEG4', 
  'B07GF97GW3', 
  'B01MUCWBVE', 
  'B07GDQMCX9', 
  'B07GXRCN59', 
  'B01MTB9YAG', 
  'B01MR8983Q', 
  'B0775YPJ5C', 
  'B01MYAGG1L', 
  'B07GFBZ93C', 
  'B07GF582G8', 
  'B07GDWYXKQ', 
  'B07GXRC3H3', 
  'B01MR8965V', 
  'B07GF58DXB', 
  'B01N24KR7N', 
  'B01NBWTH07', 
  'B07PJV1W1S', 
  'B073WGDR21', 
  'B01N365QZ3', 
  'B0775YPH6N', 
  'B07PGKX4H9', 
  'B07GF4N27S', 
  'B07GDRHSRS', 
  'B01MZC0Z6V', 
  'B01MZC12VM', 
  'B07PGKXD27', 
  'B07PJV5MVS', 
  'B01NBWNQHL', 
  'B07GDWZ9BS', 
  'B01N24KN76', 
  'B07GF583PV', 
  'B01MTB9QAN', 
  'B07SRXPHT1', 
  'B07PJTWJCH', 
  'B07GDXCX87', 
  'B07GDWZFQ8', 
  'B079LKHXTV', 
  'B01N7UG07Y', 
  'B07GF9PGZF', 
  'B07GF58DVK', 
  'B07GF58DQK', 
  'B0775XKM8K', 
  'B01N6T68H5', 
  'B07GF4ZCPP', 
  'B07GFBZ974', 
  'B07GF5FTQJ', 
  'B07GF5F3GP', 
  'B07GF7VNMV', 
  'B07PD5L5XR', 
  'B07SRXJF1W', 
  'B01MS9NT2L', 
  'B07GF97GWX', 
  'B07GDQLQQZ', 
  'B01MYAGGEX', 
  'B07GF5FTLN', 
  'B01N365RKY', 
  'B07GF9PGX1', 
  'B01NAVCIV9', 
  'B01MTB9RGG', 
  'B01MZC15UG', 
  'B01MR891PX', 
  'B01N5RJVQY', 
  'B01MS9NOQS', 
  'B0775ZMBFF', 
  'B07GF5F97V', 
  'B07PHPSDMB', 
  'B01MYAGI3F', 
  'B07GFBZ8ZW', 
  'B07SPYCNST', 
  'B07GDWZDT3', 
  'B07P7H5SL4', 
  'B079LL5FB2', 
  'B07GDQMPSY', 
  'B01N24KOZ6', 
  'B07PBWFFXV', 
  'B079LD8CRV', 
  'B07P8MJQ2S', 
  'B01N7UG046', 
  'B01MUCW82F', 
  'B07GF9PH3K', 
  'B07GDWZB6H', 
  'B01N6T6PRP', 
  'B07GDWYXKT', 
  'B07GF58FPG', 
  'B07GDQLJNW', 
  'B07SR156R7', 
  'B07GDX6899', 
  'B07SNGQQVW', 
  'B0775YPJ5F', 
  'B01MYAGGIH', 
  'B07PCZ6T36', 
  'B01MR8906D', 
  'B07GF4X7QW', 
  'B07GF5F3NB', 
  'B01N5RJLEG', 
  'B01N5RJMJB', 
  'B01N4Q95VS', 
  'B01MZC0UDL', 
  'B01N6T5DCW', 
  'B01N6T6EL8', 
  'B01N365ONN', 
  'B07GF58FSY', 
  'B07GDWZFHV', 
  'B01MR895GG', 
  'B01NBWHCD6', 
  'B07GDQNK71', 
  'B07GDWV4N6', 
  'B01MS9NRLR', 
  'B07GFBZ94B', 
  'B07GF5F3KH', 
  'B07GDWZ975', 
  'B01MZC15JL', 
  'B01MUCWAPK', 
  'B01N6T6CUI', 
  'B07SR159QF', 
  'B01MS9O63C', 
  'B07GF54QTJ', 
  'B01N5RJW49', 
  'B01MUCW4VA', 
  'B01N6T6MRI', 
  'B07GF97GW4', 
  'B07PGKXD25', 
  'B07GXRBS8B', 
  'B07GDWV8D7', 
  'B07GDRZN8M', 
  'B01MZC13KZ', 
  'B07P897MZL', 
  'B01N365QZR', 
  'B07PCZ6T3W', 
  'B07GF4N281', 
  'B01N4Q9GHN', 
  'B07PD75Q26', 
  'B01N6T6DRB', 
  'B07P66VD3J', 
  'B0775YFBRC', 
  'B01MR897RC', 
  'B07GF54QSQ', 
  'B01MR8958Y', 
  'B01N9TY3K7', 
  'B01MS9NRAH', 
  'B07T4JG2MY', 
  'B07GF7VNKR', 
  'B01N7UG2J3', 
  'B01MZC155Z', 
  'B07PKP3S48', 
  'B01MUCW4ZD', 
  'B07P7H5PL5', 
  'B01N135YBR', 
  'B01N24KM72', 
  'B01MUCW5N2', 
  'B01MUCW5BD', 
  'B07GDWYXG8', 
  'B01MTBA4M1', 
  'B01N9TY5SV', 
  'B07P74YK4K', 
  'B07PCZ1HJH', 
  'B01MYAGJ81', 
  'B01MTB9SIM', 
  'B07P9R15KR', 
  'B07GFFLG89', 
  'B07T3F6JST', 
  'B01NBWN35A', 
  'B07P897TGP', 
  'B07GF9P3FJ', 
  'B07GDQNK7Q', 
  'B01N5RJOD9', 
  'B01MZC13JY', 
  'B01N13618D', 
  'B01MR894HU', 
  'B01N7UFWVD', 
  'B01NBWHGY1', 
  'B07Q1R743X', 
  'B07PBWH9KJ', 
  'B01N135Z3Z', 
  'B07P8MJWJ2', 
  'B01N7UGH68', 
  'B01N4Q95VV', 
  'B01MS9NU1H', 
  'B01N7UG3H7', 
  'B07GF4MRC5', 
  'B07GF586K9', 
  'B01NBWJJE1', 
  'B07PBWBDWL', 
  'B01N24KLFD', 
  'B0776C21XS', 
  'B01N6SFE53', 
  'B07GDQM2TW', 
  'B01N365QIU', 
  'B07T3F628P', 
  'B01MYAGFI2', 
  'B07PCMD4TW', 
  'B01N7UFZWD', 
  'B077626HSZ', 
  'B07GF586FM', 
  'B07PXDC734', 
  'B0775YFK1Z', 
  'B07PCL8S8K', 
  'B07SZ78BQ5', 
  'B07GDQMCXN', 
  'B07PCZ7JX8', 
  'B01NBWN410', 
  'B07P9QZR32', 
  'B07NKWNYWX', 
  'B07P8MHWSG', 
  'B01N135VOH', 
  'B07PCZ7N21', 
  'B01N4Q9NBZ', 
  'B07PBWFWZ8', 
  'B07PBWG5SS', 
  'B01MS9NRDV', 
  'B01N135PPL', 
  'B01N5RJIK4', 
  'B07P8MJZDS', 
  'B01MUCWAF5', 
  'B07RV872TL', 
  'B01N7UFYLH', 
  'B01N135YPV', 
  'B07GDX68B5', 
  'B07GF5F9DJ', 
  'B07P8MK1DR', 
  'B01N365KZC', 
  'B01N6T6BUN', 
  'B07PW78D2J', 
  'B01N135YBU', 
  'B01MUCW4YZ', 
  'B01MTB9U1U', 
  'B07PV921WY', 
  'B01MR8912N', 
  'B07Q1RCXNF', 
  'B01N365NF3', 
  'B07P8ML7XM', 
  'B07PCZ6T15', 
  'B07PD5BVW4', 
  'B07GF5F9DS', 
  'B07PW785N3', 
  'B01MZC1DST', 
  'B01MR893N0', 
  'B01N135WN2', 
  'B07S9SNS78', 
  'B07PXDCBMC', 
  'B07S9SNS7L', 
  'B01N5RJQQQ', 
  'B01MYAGFD2', 
  'B07Q1QK2KR', 
  'B01NAVCIUU', 
  'B07PBWF98T', 
  'B07PBWJ4VN', 
  'B07SBWDK5S', 
  'B01N6T6DTQ', 
  'B07Q1R73WQ', 
  'B01MS9O5OC', 
  'B07PJTZTBD', 
  'B07PJTYNJ7', 
  'B07PZN9BF4', 
  'B07PW76MP9', 
  'B01N9TY7UE', 
  'B07PFFFFN5', 
  'B07NKX2BRD', 
  'B01N5RJXS7', 
  'B07PDHMHDH', 
  'B07PXDHZYV', 
  'B07Q1QDV75', 
  'B07S7RCRMB', 
  'B07S9SR5BH', 
  'B07S8QBDCL', 
  'B07PZN8Z44', 
  'B077626HSW', 
  'B08VF8XXBV', 
  'B08VFC8328', 
  'B08VFC2XJW', 
  'B08VF8HPPR', 
  'B08VF8LPJN', 
  'B08VF8V7F6', 
  'B08VF8YG3J', 
  'B08VF8WC3X', 
  'B08VFC1KWR', 
  'B08VF8WTR8', 
  'B08VFC8339', 
  'B08VFC3492', 
  'B08VF6TTWX', 
  'B08VF8YG41', 
  'B08VFCDQSR', 
  'B08VFBNDC5', 
  'B08VF8Y758', 
  'B088XZRWR8', 
  'B088XD68S2', 
  'B088Y6WPLV', 
  'B088XT66TB', 
  'B088XVCWM4', 
  'B0897X6KGH', 
  'B0897TVXSJ', 
  'B088XT5F9F', 
  'B088XVQCQB', 
  'B088XSBTQR', 
  'B088XVQDH7', 
  'B088XWMB8T', 
  'B088XXNCMB', 
  'B088XWV8ZF', 
  'B088XQMZSH', 
  'B088XQNV7Q', 
  'B088XVQDHL', 
  'B088XSBTR5', 
  'B088XT53YG', 
  'B088XT53YJ', 
  'B088Y4JBPW', 
  'B088XD7PDY', 
  'B088XQNGKG', 
  'B088XD9S76', 
  'B088XWMB9P', 
  'B088Y4H5NC', 
  'B088XQNV8G', 
  'B088XXPK6C', 
  'B088XVCXFX', 
  'B088Y1MT64', 
  'B088Y1MT66', 
  'B088Y221P7', 
  'B088XT53Z9', 
  'B088Y1CY4R', 
  'B088XXP29K', 
  'B089R8S365', 
  'B089R7J1CQ', 
  'B08Z8PHG82', 
  'B08Z8XMG2W', 
  'B088Y3JY8K', 
  'B088XT96ZV', 
  'B088XR9TJW', 
  'B088XWZ95X', 
  'B088XWMM5L', 
  'B088XZRWRV', 
  'B088XWZ961', 
  'B088Y6WPMG', 
  'B088XD68ST', 
  'B088XZRWSG', 
  'B0924X3XS1', 
  'B0897YKFNC', 
  'B0897YKFNK', 
]

// const asins = [
//   'B07GF4ZR17',
//   'B07GDXCPGD',
//   'B01MUCW80B',
//   'B0775YFK3P',
//   'B07767WNWT',
//   'B07GF5FTM5',
//   'B07GF58FQ3',
//   'B07GF5F3H6',
//   'B07GF7VNMZ',
//   'B07GDWYXJK',
//   'B01N24KKWK',
//   'B07767BJG4',
//   'B07GDQLV3G',
//   'B01N5RJL3B',
//   'B01MR894RT',
//   'B073WGN8DW',
//   'B079L9X9M4',
//   'B07PJTYNC7',
//   'B07GF54KV8',
//   'B079L6LY25',
//   'B07GF4X7WC',
//   'B07763W5NX',
//   'B0775ZBQZT',
//   'B0775XKM8R',
//   'B07GDWZFLL',
//   'B073WFL878',
//   'B01MYAGID4',
//   'B07GDWV5WT',
//   'B01N24KI7Y',
//   'B07GF9P3FY',
//   'B01MS9NU4J',
//   'B01MYAGE6W',
//   'B01MS9NT4M',
//   'B07763RB3V',
//   'B01MTB9W7E',
//   'B01MTB9T2P',
//   'B01MR892S8',
//   'B079L7MXTK',
//   'B01MS9NV9T',
//   'B0775YFK36',
//   'B01N24KM9U',
//   'B01N4Q81F7',
//   'B01MZC15J5',
//   'B0775ZMBDX',
//   'B07GFFLGH5',
//   'B07762NXPM',
//   'B07GF4X7QG',
//   'B07GDS15KG',
//   'B07GDRZXSS',
//   'B07GF9P3GL',
//   'B07GDWYYX2',
//   'B01MS9NU0O',
//   'B07GXRC3H3',
//   'B01MYAGERU',
//   'B07GDWYZ3H',
//   'B079L6LY1V',
//   'B0776C21Z8',
//   'B079L9X9L4',
//   'B07765Z6S4',
//   'B07763QC7R',
//   'B07GF5F3HZ',
//   'B01MYAGGST',
//   'B01MS9NPGA',
//   'B07GXRCN59',
//   'B07GF4X7TR',
//   'B073WGDR21',
//   'B07GF583NX',
//   'B01MYAGGEX',
//   'B01MTBA4V3',
//   'B01MR892ED',
//   'B01MR8983Q',
//   'B01N7UFZIN',
//   'B07GF54QVJ',
//   'B01MTB9YAG',
//   'B07GF97GW3',
//   'B07PHPSK3C',
//   'B01MUCWBVE',
//   'B07GDWV53C',
//   'B07PJV1W1S',
//   'B07GDQLV46',
//   'B0775YPJ5C',
//   'B01MZC12VM',
//   'B0775YPH6N',
//   'B07GF58DXB',
//   'B07GF5F9DF',
//   'B01N24KR7N',
//   'B07GF4N27S',
//   'B01MYAGG1L',
//   'B01NBWTEG4',
//   'B01MS9NT2L',
//   'B07GFBZ93C',
//   'B01N6T6PRP',
//   'B07GDWYXKQ',
//   'B07GDQMCX9',
//   'B01NBWTH07',
//   'B01MS9NOQS',
//   'B079LKHXTV',
//   'B01MZC0Z6V',
//   'B07GDQLQQZ',
//   'B01MR8965V',
//   'B07GFBZ8ZW',
//   'B01N24KN76',
//   'B07GF582G8',
//   'B01NBWNQHL',
//   'B07PJTWJCH',
//   'B01N6T6EL8',
//   'B01NAVCIV9',
//   'B0775XKM8K',
//   'B01N365QZ3',
//   'B01N6T6MRI',
//   'B07PGKX4H9',
//   'B079LD8CRV',
//   'B07PGKXD27',
//   'B07GF5FTLN',
//   'B07SRXPHT1',
//   'B01MTB9QAN',
//   'B07GDRHSRS',
//   'B07GDXCX87',
//   'B07GF9PGX1',
//   'B07PHPSDMB',
//   'B07GDWZ9BS',
//   'B07PJV5MVS',
//   'B07SRXJF1W',
//   'B01N7UG07Y',
//   'B07GF9PGZF',
//   'B07GF58DVK',
//   'B0775ZMBFF',
//   'B01N5RJLEG',
//   'B0775YPJ5F',
//   'B01MZC15UG',
//   'B07P8MJQ2S',
//   'B01N365OT5',
//   'B07GDWZFQ8',
//   'B07GF583PV',
//   'B01N6T68H5',
//   'B07PD5L5XR',
//   'B01N365RKY',
//   'B01MUCW82F',
//   'B01N6T5DCW',
//   'B07GF58DQK',
//   'B07GF5F3GP',
//   'B01MR891PX',
//   'B01MTB9RGG',
//   'B01N5RJVQY',
//   'B07GF7VNMV',
//   'B07GF97GWX',
//   'B01N7UG046',
//   'B01MS9NRLR',
//   'B07GFBZ974',
//   'B07GF4ZCPP',
//   'B01N6T6DRB',
//   'B07GF5FTQJ',
//   'B01N5RJW49',
//   'B07GXRBS8B',
//   'B01MYAGI3F',
//   'B07GDQMPSY',
//   'B01N365ONN',
//   'B07GDWYXKT',
//   'B07PBWFFXV',
//   'B079LL5FB2',
//   'B01MR8906D',
//   'B07GDWZDT3',
//   'B07GF97GW4',
//   'B07P7H5SL4',
//   'B07GF5F97V',
//   'B01NBWHCD6',
//   'B01MZC15JL',
//   'B01N135YBR',
//   'B01N4Q95VS',
//   'B07GFBZ94B',
//   'B01N24KOZ6',
//   'B01MYAGGIH',
//   'B07SPYCNST',
//   'B07SNGQQVW',
//   'B01N5RJMJB',
//   'B01NBWN35A',
//   'B01MS9NRAH',
//   'B01N7UGH68',
//   'B07GDQLJNW',
//   'B07GF9PH3K',
//   'B07GDWZB6H',
//   'B07GDWZFHV',
//   'B07GF58FPG',
//   'B01MUCW4VA',
//   'B07PCZ6T36',
//   'B01N1362CQ',
//   'B07P897MZL',
//   'B01MR895GG',
//   'B07GDX6899',
//   'B01MZC0UDL',
//   'B07GF5F3NB',
//   'B07GF4X7QW',
//   'B07SR156R7',
//   'B07GF54QTJ',
//   'B0775YFBRC',
//   'B01MZC13KZ',
//   'B01MZC155Z',
//   'B07PCZ6T3W',
//   'B07GDWV4N6',
//   'B07GDQNK71',
//   'B01MUCWAPK',
//   'B07GF58FSY',
//   'B01N5RJN86',
//   'B01N6T6CUI',
//   'B01MR8958Y',
//   'B01MUCW5N2',
//   'B07Q1R743X',
//   'B01MR897RC',
//   'B01N4Q9GHN',
//   'B07GDWZ975',
//   'B07PKP3S48',
//   'B07GF5F3KH',
//   'B07SR159QF',
//   'B07PD75Q26',
//   'B07PGKXD25',
//   'B01MS9O63C',
//   'B01MR894HU',
//   'B07P66VD3J',
//   'B01N365QZR',
//   'B01N135Z3Z',
//   'B07GDWV8D7',
//   'B07GDRZN8M',
//   'B07GF4N281',
//   'B01N365QIU',
//   'B0776C21XS',
//   'B07GF7VNKR',
//   'B01MUCW5BD',
//   'B01MUCW4ZD',
//   'B01N9TY3K7',
//   'B07PBWH9KJ',
//   'B01N7UG2J3',
//   'B07P9R15KR',
//   'B077626HSZ',
//   'B07GF54QSQ',
//   'B01N9TY5SV',
//   'B07P7H5PL5',
//   'B01MS9NU1H',
//   'B07PBWFWZ8',
//   'B01MYAGJ81',
//   'B01N135YBU',
//   'B01N5RJQQQ',
//   'B01MZC1DST',
//   'B07P897TGP',
//   'B01N7UFWVD',
//   'B01NBWJJE1',
//   'B01N4Q95VV',
//   'B07GFFLG89',
//   'B01NBWHGY1',
//   'B01N24KM72',
//   'B07T4JG2MY',
//   'B07GDWYXG8',
//   'B01N7UG3H7',
//   'B07PBWBDWL',
//   'B01N13618D',
//   'B01MZC13JY',
//   'B01MTBA4M1',
//   'B01MYAGFD2',
//   'B01MZC16EQ',
//   'B01N7UFZWD',
//   'B07PCZ1HJH',
//   'B07P8MJWJ2',
//   'B01N5RJOD9',
//   'B07P8MK1DR',
//   'B01MTB9SIM',
//   'B07T3F6JST',
//   'B07P74YK4K',
//   'B01N6SFE53',
//   'B01MS9NRMB',
//   'B01N9TY7UE',
//   'B0775YFK1Z',
//   'B01NBWN410',
//   'B01MYAGFI2',
//   'B07GF9P3FJ',
//   'B07GDQNK7Q',
//   'B01MS9NRDV',
//   'B01N5RJIK4',
//   'B07P8MHWSG',
//   'B01MZC13VQ',
//   'B07GDQM2TW',
//   'B07PCMD4TW',
//   'B01N24KLFD',
//   'B07PXDC734',
//   'B07PCL8S8K',
//   'B07PCZ7JX8',
//   'B07GF586FM',
//   'B01N365KZC',
//   'B01MTB9U1U',
//   'B07NKWNYWX',
//   'B07SZ78BQ5',
//   'B07GF586K9',
//   'B01N4Q9NBZ',
//   'B07GF4MRC5',
//   'B07PCZ7N21',
//   'B01MUCWAF5',
//   'B01N6T6BUN',
//   'B01MUCW4YZ',
//   'B07T3F628P',
//   'B07P9QZR32',
//   'B01N135PPL',
//   'B07P8MJZDS',
//   'B01MR893N0',
//   'B07PBWG5SS',
//   'B01N135YPV',
//   'B01N135VOH',
//   'B07PW78D2J',
//   'B07GDQMCXN',
//   'B01N7UFYLH',
//   'B07Q1RCXNF',
//   'B01N5RJXS7',
//   'B01MS9O5OC',
//   'B07PD5BVW4',
//   'B07GF5F9DJ',
//   'B01N365NF3',
//   'B07PV921WY',
//   'B07GDX68B5',
//   'B07P8ML7XM',
//   'B07PBWJ4VN',
//   'B07Q1QK2KR',
//   'B07RV872TL',
//   'B07PCZ6T15',
//   'B01MR8912N',
//   'B07Q1QDV75',
//   'B07PXDCBMC',
//   'B07PZN8Z44',
//   'B07PBWF98T',
//   'B01NAVCIUU',
//   'B07PW785N3',
//   'B07GF5F9DS',
//   'B07PFFFFN5',
//   'B01N135WN2',
//   'B07Q1R73WQ',
//   'B01N6T6DTQ',
//   'B07PJTZTBD',
//   'B07PJTYNJ7',
//   'B07S9SNS78',
//   'B07S8QBDCL',
//   'B07PW76MP9',
//   'B07PZN9BF4',
//   'B077626HSW',
//   'B07NKX2BRD',
//   'B07S9SNS7L',
//   'B07SBWDK5S',
//   'B07PXDHZYV',
//   'B07PDHMHDH',
//   'B07S9SR5BH',
//   'B07S7RCRMB',
// ]

const asins2 = [
  'B07GF4ZR17',
'B07GF4ZR18',
'B07GF4ZR19',
'B07GF4ZR20',
'B07GF4ZR21',
'B07GF4ZR22',
'B07GF4ZR23',
'B07GF4ZR24',
'B07GF4ZR25',
'B07GF4ZR26',
'B07GF4ZR27',
'B07GF4ZR28',
'B07GF4ZR29',
'B07GF4ZR30',
'B07GF4ZR31',
'B07GF4ZR32',
'B07GF4ZR33',
'B07GF4ZR34',
'B07GF4ZR35',
'B07GF4ZR36',
'B07GF4ZR37',
'B07GF4ZR38',
'B07GF4ZR39',
'B07GF4ZR40',
'B07GF4ZR41',
'B07GF4ZR42',
'B07GF4ZR43',
'B07GF4ZR44',
'B07GF4ZR45',
]

module.exports = {
  asins,
  asins2,
  testData,
  asinsWithCompetitors
}



// B07GF4ZR17
// B07GF4ZR18
// B07GF4ZR19
// B07GF4ZR20
// B07GF4ZR21
// B07GF4ZR22
// B07GF4ZR23
// B07GF4ZR24
// B07GF4ZR25
// B07GF4ZR26
// B07GF4ZR27
// B07GF4ZR28
// B07GF4ZR29
// B07GF4ZR30
// B07GF4ZR31
// B07GF4ZR32
// B07GF4ZR33
// B07GF4ZR34
// B07GF4ZR35
// B07GF4ZR36
// B07GF4ZR37
// B07GF4ZR38
// B07GF4ZR39
// B07GF4ZR40
// B07GF4ZR41
// B07GF4ZR42
// B07GF4ZR43
// B07GF4ZR44
// B07GF4ZR45