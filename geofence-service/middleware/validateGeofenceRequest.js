module.exports = (
    req,
    res,
    next
) => {

    console.log("✅ validateGeofenceRequest middleware executed");

    const {
        employeeId,
        latitude,
        longitude
    } = req.body;

    if (
        !employeeId ||
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            message:
                "employeeId, latitude and longitude are required"
        });
    }

    next();
};