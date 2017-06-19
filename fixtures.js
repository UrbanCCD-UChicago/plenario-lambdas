const sampleObservations = [
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 843 },
    sensor: "pr103j2",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { intensity: 21464 },
    sensor: "tsl260rd",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { intensity: 1928 },
    sensor: "apds-9006-020",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { intensity: 31480 },
    sensor: "mlx75305",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { intensity: 11818 },
    sensor: "ml8511",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: {
      orient_y: 1,
      orient_z: -1,
      accel_z: 30,
      orient_x: 3,
      accel_y: 981,
      accel_x: -10
    },
    sensor: "bmi160",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 23.15, humidity: 11.4 },
    sensor: "htu21d",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 2392, humidity: 1682 },
    sensor: "sht25",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 23.93 },
    sensor: "tmp112",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 45.58, humidity: 36.46 },
    sensor: "hih6130",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 24.15 },
    sensor: "tsys01",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 38.43 },
    sensor: "tmp421",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { z: -0.637, y: -0.161, x: -0.402 },
    sensor: "hmc5883l",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 2293, pressure: 83611 },
    sensor: "lps25h",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { temperature: 23.89, pressure: 83287 },
    sensor: "bmp180",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { z: 0.01, y: -1.01, x: 0.02 },
    sensor: "mma8452q",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: { humidity: 264 },
    sensor: "hih4030",
    node_id: "0000001e0610ba72"
  },
  {
    datetime: "2017-04-07 17:50:51",
    network: "array_of_things_chicago",
    meta_id: 1,
    data: {
      o3: 367816,
      co: 4410,
      reducing_gases: 77,
      h2s: 24829,
      no2: 2239,
      so2: -362051,
      oxidizing_gases: 34538
    },
    sensor: "chemsense",
    node_id: "0000001e0610ba72"
  }
];

const sampleTree = {
  array_of_things_chicago: {
    "0000001e0610b9e7": {
      tsys01: { temperature: "temperature.temperature" },
      "apds-9006-020": { intensity: "light_intensity.500nm" },
      chemsense: {
        co: "gas_concentration.co",
        reducing_gases: "gas_concentration.reducing_gases",
        h2s: "gas_concentration.h2s",
        so2: "gas_concentration.so2",
        oxidizing_gases: "gas_concentration.oxidizing_gases",
        o3: "gas_concentration.o3",
        no2: "gas_concentration.no2"
      },
      mma8452q: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      ml8511: { intensity: "light_intensity.365nm" },
      tsl260rd: { intensity: "light_intensity.940nm" },
      hih6130: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      bmp180: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      sht25: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      hih4030: { humidity: "relative_humidity.humidity" },
      bmi160: {
        accel_z: "acceleration.z",
        accel_x: "acceleration.x",
        accel_y: "acceleration.y",
        orient_z: "orientation.z",
        orient_x: "orientation.x",
        orient_y: "orientation.y"
      },
      htu21d: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      lps25h: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      tmp421: { temperature: "temperature.internal_temperature" },
      tmp112: { temperature: "temperature.temperature" },
      hmc5883l: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      mlx75305: { intensity: "light_intensity.700nm" },
      pr103j2: { temperature: "temperature.temperature" }
    },
    "0000001e0610ba89": {
      tsys01: { temperature: "temperature.temperature" },
      "apds-9006-020": { intensity: "light_intensity.500nm" },
      chemsense: {
        co: "gas_concentration.co",
        reducing_gases: "gas_concentration.reducing_gases",
        h2s: "gas_concentration.h2s",
        so2: "gas_concentration.so2",
        oxidizing_gases: "gas_concentration.oxidizing_gases",
        o3: "gas_concentration.o3",
        no2: "gas_concentration.no2"
      },
      mma8452q: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      ml8511: { intensity: "light_intensity.365nm" },
      tsl260rd: { intensity: "light_intensity.940nm" },
      hih6130: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      bmp180: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      sht25: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      hih4030: { humidity: "relative_humidity.humidity" },
      bmi160: {
        accel_z: "acceleration.z",
        accel_x: "acceleration.x",
        accel_y: "acceleration.y",
        orient_z: "orientation.z",
        orient_x: "orientation.x",
        orient_y: "orientation.y"
      },
      htu21d: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      lps25h: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      tmp421: { temperature: "temperature.internal_temperature" },
      tmp112: { temperature: "temperature.temperature" },
      hmc5883l: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      mlx75305: { intensity: "light_intensity.700nm" },
      pr103j2: { temperature: "temperature.temperature" }
    },
    "0000001e0610b9fd": {
      tsys01: { temperature: "temperature.temperature" },
      "apds-9006-020": { intensity: "light_intensity.500nm" },
      chemsense: {
        co: "gas_concentration.co",
        reducing_gases: "gas_concentration.reducing_gases",
        h2s: "gas_concentration.h2s",
        so2: "gas_concentration.so2",
        oxidizing_gases: "gas_concentration.oxidizing_gases",
        o3: "gas_concentration.o3",
        no2: "gas_concentration.no2"
      },
      mma8452q: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      ml8511: { intensity: "light_intensity.365nm" },
      tsl260rd: { intensity: "light_intensity.940nm" },
      hih6130: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      bmp180: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      sht25: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      hih4030: { humidity: "relative_humidity.humidity" },
      bmi160: {
        accel_z: "acceleration.z",
        accel_x: "acceleration.x",
        accel_y: "acceleration.y",
        orient_z: "orientation.z",
        orient_x: "orientation.x",
        orient_y: "orientation.y"
      },
      htu21d: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      lps25h: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      tmp421: { temperature: "temperature.internal_temperature" },
      tmp112: { temperature: "temperature.temperature" },
      hmc5883l: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      mlx75305: { intensity: "light_intensity.700nm" },
      pr103j2: { temperature: "temperature.temperature" }
    },
    "0000001e0610ba72": {
      tsys01: { temperature: "temperature.temperature" },
      "apds-9006-020": { intensity: "light_intensity.500nm" },
      chemsense: {
        co: "gas_concentration.co",
        reducing_gases: "gas_concentration.reducing_gases",
        h2s: "gas_concentration.h2s",
        so2: "gas_concentration.so2",
        oxidizing_gases: "gas_concentration.oxidizing_gases",
        o3: "gas_concentration.o3",
        no2: "gas_concentration.no2"
      },
      mma8452q: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      ml8511: { intensity: "light_intensity.365nm" },
      tsl260rd: { intensity: "light_intensity.940nm" },
      hih6130: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      bmp180: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      sht25: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      hih4030: { humidity: "relative_humidity.humidity" },
      bmi160: {
        accel_z: "acceleration.z",
        accel_x: "acceleration.x",
        accel_y: "acceleration.y",
        orient_z: "orientation.z",
        orient_x: "orientation.x",
        orient_y: "orientation.y"
      },
      htu21d: {
        temperature: "temperature.temperature",
        humidity: "relative_humidity.humidity"
      },
      lps25h: {
        pressure: "atmospheric_pressure.pressure",
        temperature: "temperature.temperature"
      },
      tmp421: { temperature: "temperature.internal_temperature" },
      tmp112: { temperature: "temperature.temperature" },
      hmc5883l: {
        y: "magnetic_field.y",
        x: "magnetic_field.x",
        z: "magnetic_field.z"
      },
      mlx75305: { intensity: "light_intensity.700nm" },
      pr103j2: { temperature: "temperature.temperature" }
    }
  },
  plenario_development: {
    node_dev_2: {
      sensor_dev_3: {
        n2: "gas_concentration.n2",
        co2: "gas_concentration.co2"
      },
      "sensor_dev_2 ": { humidity: "relative_humidity.humidity" }
    },
    node_dev_1: {
      sensor_dev_1: { mag_y: "magnetic_field.y", mag_x: "magnetic_field.x" },
      sensor_dev_4: {
        oxygen: "gas_concentration.o2",
        temp: "temperature.temperature",
        mag_z: "magnetic_field.z"
      }
    }
  }
};

exports.sampleObservations = sampleObservations;
exports.sampleTree = sampleTree;
