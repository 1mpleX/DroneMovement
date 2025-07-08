package com.example.dronemovement.Controller;

import com.example.dronemovement.DTO.DetectedDroneType;
import com.example.dronemovement.DTO.DroneRequest;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/drones")
public class DroneController {

    @PostMapping("/predict-path")
    public PredictionResponse predictDronePath(@RequestBody DroneRequest droneRequest) {

        List<DroneRequest.TelemetryPoint> telemetry = droneRequest.getTelemetry();

        if (telemetry == null || telemetry.size() < 2) {
            System.out.println("Недостаточно точек для предсказания маршрута.");
            return new PredictionResponse(droneRequest.getDrone_id(), List.of());
        }

        DroneRequest.TelemetryPoint prev = telemetry.get(telemetry.size() - 2);
        DroneRequest.TelemetryPoint curr = telemetry.get(telemetry.size() - 1);

        double timeDiff = curr.getTime() - prev.getTime();

        if (timeDiff <= 0) {
            System.out.println("Временной интервал равен нулю, отрицателен или пустой.");
            return new PredictionResponse(droneRequest.getDrone_id(), List.of());
        }

        double lonSpeed = (curr.getPosition().get(0) - prev.getPosition().get(0)) / timeDiff;
        double latSpeed = (curr.getPosition().get(1) - prev.getPosition().get(1)) / timeDiff;
        double altSpeed = (curr.getAltitude() - prev.getAltitude()) / timeDiff;

        List<PredictedPoint> predictedPoints = new ArrayList<>();

        for (int t = 1; t <= 10; t++) {
            double predictedLon = curr.getPosition().get(0) + lonSpeed * t;
            double predictedLat = curr.getPosition().get(1) + latSpeed * t;
            double predictedAlt = curr.getAltitude() + altSpeed * t;

            predictedPoints.add(
                    new PredictedPoint(t, predictedLon, predictedLat, predictedAlt)
            );

//            System.out.printf(
//                    "Через %d cекунд: lon=%.8f, lat=%.8f, alt=%.2f%n",
//                    t, predictedLon, predictedLat, predictedAlt
//            );
        }

        return new PredictionResponse(droneRequest.getDrone_id(), predictedPoints);
    }


    @NoArgsConstructor
    @Data
    public static class PredictionResponse {
        private String droneId;
        private List<PredictedPoint> predictedPoints;

        public PredictionResponse(String droneId, List<PredictedPoint> predictedPoints) {
            this.droneId = droneId;
            this.predictedPoints = predictedPoints;
        }
    }

    @NoArgsConstructor
    @Data
    public static class PredictedPoint {
        private int secondsAhead;
        private double longitude;
        private double latitude;
        private double altitude;

        public PredictedPoint(int secondsAhead, double longitude, double latitude, double altitude) {
            this.secondsAhead = secondsAhead;
            this.longitude = longitude;
            this.latitude = latitude;
            this.altitude = altitude;
        }
    }

    @PostMapping("/drone-type")
    public DetectedDroneType detectDroneType(@RequestBody DroneRequest droneRequest) {
        var telemetry = droneRequest.getTelemetry();

        if (telemetry == null || telemetry.size() < 3) {
            return new DetectedDroneType(droneRequest.getDrone_id(), "unknown");
        }

        double totalTurn = 0;
        double totalSpeedChange = 0;
        int turnCount = 0;

        for (int i = 2; i < telemetry.size(); i++) {
            var p1 = telemetry.get(i - 2);
            var p2 = telemetry.get(i - 1);
            var p3 = telemetry.get(i);

            double dx1 = p2.getPosition().get(0) - p1.getPosition().get(0);
            double dy1 = p2.getPosition().get(1) - p1.getPosition().get(1);
            double dx2 = p3.getPosition().get(0) - p2.getPosition().get(0);
            double dy2 = p3.getPosition().get(1) - p2.getPosition().get(1);

            double dot = dx1 * dx2 + dy1 * dy2;
            double mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            double mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            double angle = Math.acos(dot / (mag1 * mag2 + 1e-6));

            if (!Double.isNaN(angle)) {
                totalTurn += angle;
                if (angle > Math.toRadians(20)) {
                    turnCount++;
                }
            }

            double dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            double dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            double dt1 = p2.getTime() - p1.getTime();
            double dt2 = p3.getTime() - p2.getTime();
            if (dt1 > 0 && dt2 > 0) {
                double speed1 = dist1 / dt1;
                double speed2 = dist2 / dt2;
                totalSpeedChange += Math.abs(speed2 - speed1);
            }
        }

        double avgTurn = totalTurn / (telemetry.size() - 2);
        double avgAccel = totalSpeedChange / (telemetry.size() - 2);

        String detectedType;

        if (avgTurn > Math.toRadians(15) && avgAccel < 0.0025) {
            detectedType = "quadcopter";
        } else if (avgTurn < Math.toRadians(5) && avgAccel > 0.01) {
            detectedType = "fixed-wing";
        } else {
            detectedType = "VTOL";
        }
//        System.out.printf("Обнаружен тип дрона: %s (Угол: %.2f°, Ускорение: %.5f)%n",
//                detectedType, Math.toDegrees(avgTurn), avgAccel);

        return new DetectedDroneType(droneRequest.getDrone_id(), detectedType);
    }

}

