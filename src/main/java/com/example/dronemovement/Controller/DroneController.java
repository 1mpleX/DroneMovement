package com.example.dronemovement.Controller;

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

            System.out.printf(
                    "Через %d cекунд: lon=%.8f, lat=%.8f, alt=%.2f%n",
                    t, predictedLon, predictedLat, predictedAlt
            );
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
}

