const { getDistance } = require("geolib");
const db = require("../config/db");

const getGeofence = () => {

    return new Promise(
        (resolve, reject) => {

            db.query(
                "SELECT * FROM geofences LIMIT 1",
                (err, results) => {

                    if (err) {
                        return reject(err);
                    }

                    if (results.length === 0) {
                        return reject(
                            new Error(
                                "No geofence found"
                            )
                        );
                    }

                    resolve(results[0]);
                }
            );
        }
    );
};

const validateLocation = async (
    latitude,
    longitude
) => {

    const geofence =
        await getGeofence();

    const distance =
        getDistance(
            {
                latitude:
                    Number(latitude),

                longitude:
                    Number(longitude)
            },
            {
                latitude:
                    Number(
                        geofence.latitude
                    ),

                longitude:
                    Number(
                        geofence.longitude
                    )
            }
        );

    return {
        officeName:
            geofence.office_name,

        distance,

        radius:
            geofence.radius,

        insideGeofence:
            distance <=
            geofence.radius
    };
};

module.exports = {
    validateLocation
};