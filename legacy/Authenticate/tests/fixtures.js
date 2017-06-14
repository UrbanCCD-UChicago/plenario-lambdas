module.exports.noAuthRequest =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=',
}

module.exports.randomAuthRequest =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=asf!@$51n2p9cn;;asdnlkh1$',
}

module.exports.authRequest =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B0000001e0610ba72%3Btmp421',
}

module.exports.authRequestNetwork =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago',
}

module.exports.badAuthRequestNetwork =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_zhivago%3B0000001e0610ba72%3Btmp421',
}

module.exports.authRequestNode =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B0000001e0610ba72',
}

module.exports.badAuthRequestNode =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3Biamnotanode%3Btmp421',
}

module.exports.authRequestSensor =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B%3Btmp421',
}

module.exports.badAuthRequestSensor =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B0000001e0610ba72%3Biamnotasensor',
}

module.exports.authRequestFeature =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B%3B%3Btemperature',
}

module.exports.badAuthRequestFeature =  {
    httpMethod: 'POST',
    body: 'socket_id=216029.220862&channel_name=private-array_of_things_chicago%3B%3B%3Biamnotafeature',
}