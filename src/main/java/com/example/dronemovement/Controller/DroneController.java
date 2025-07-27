package com.example.dronemovement.Controller;

import com.example.dronemovement.DTO.DetectedDroneType;
import com.example.dronemovement.DTO.DroneRequest;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.apache.commons.math3.analysis.interpolation.SplineInterpolator;
import org.apache.commons.math3.analysis.polynomials.PolynomialSplineFunction;
import org.apache.commons.math3.fitting.PolynomialCurveFitter;
import org.apache.commons.math3.fitting.WeightedObservedPoints;

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

        return new DetectedDroneType(droneRequest.getDrone_id(), detectedType);
    }

    @PostMapping("/trajectory-visualization")
    public TrajectoryVisualizationResponse getTrajectoryVisualization(@RequestBody DroneRequest droneRequest) {
        List<DroneRequest.TelemetryPoint> telemetry = droneRequest.getTelemetry();
        String method = droneRequest.getMethod();
        int pointsLimit = droneRequest.getPoints_limit() != null ? droneRequest.getPoints_limit() : 0;
        if (pointsLimit > 1 && telemetry != null) {
            telemetry = telemetry.subList(0, Math.min(pointsLimit, telemetry.size()));
        }
        if (telemetry == null || telemetry.size() < 2) {
            return new TrajectoryVisualizationResponse(
                    droneRequest.getDrone_id(),
                    List.of(),
                    List.of(),
                    List.of()
            );
        }

        List<PredictedPoint> currentTrajectory = new ArrayList<>();
        for (DroneRequest.TelemetryPoint point : telemetry) {
            currentTrajectory.add(new PredictedPoint(
                    point.getTime(),
                    point.getPosition().get(0),
                    point.getPosition().get(1),
                    point.getAltitude()
            ));
        }

        DroneRequest.TelemetryPoint prev = telemetry.get(telemetry.size() - 2);
        DroneRequest.TelemetryPoint curr = telemetry.get(telemetry.size() - 1);
        double timeDiff = curr.getTime() - prev.getTime();
        double lonSpeed = (curr.getPosition().get(0) - prev.getPosition().get(0)) / timeDiff;
        double latSpeed = (curr.getPosition().get(1) - prev.getPosition().get(1)) / timeDiff;
        double altSpeed = (curr.getAltitude() - prev.getAltitude()) / timeDiff;
        List<PredictedPoint> forecast = new ArrayList<>();
        for (int t = 1; t <= 10; t++) {
            forecast.add(new PredictedPoint(
                    curr.getTime() + t,
                    curr.getPosition().get(0) + lonSpeed * t,
                    curr.getPosition().get(1) + latSpeed * t,
                    curr.getAltitude() + altSpeed * t
            ));
        }

        List<PredictedPoint> realContinuation = new ArrayList<>();
        if ("interpolation".equalsIgnoreCase(method) && telemetry.size() >= 4) {

            double[] x = new double[telemetry.size()];
            double[] y = new double[telemetry.size()];
            double[] alt = new double[telemetry.size()];
            double[] t = new double[telemetry.size()];
            for (int i = 0; i < telemetry.size(); i++) {
                x[i] = telemetry.get(i).getPosition().get(0);
                y[i] = telemetry.get(i).getPosition().get(1);
                alt[i] = telemetry.get(i).getAltitude();
                t[i] = i + 1;
            }
            SplineInterpolator interpolator = new SplineInterpolator();
            PolynomialSplineFunction splineY = interpolator.interpolate(x, y);
            PolynomialSplineFunction splineAlt = interpolator.interpolate(x, alt);
            double minX = x[0], maxX = x[x.length - 1];
            int N = 20;
            for (int i = 0; i < N; i++) {
                double xi = minX + (maxX - minX) * i / (N - 1);
                realContinuation.add(new PredictedPoint(
                    i + 1,
                    xi,
                    splineY.value(xi),
                    splineAlt.value(xi)
                ));
            }
        } else if ("approximation".equalsIgnoreCase(method) && telemetry.size() >= 4) {

            WeightedObservedPoints obsY = new WeightedObservedPoints();
            WeightedObservedPoints obsAlt = new WeightedObservedPoints();
            for (int i = 0; i < telemetry.size(); i++) {
                double x = telemetry.get(i).getPosition().get(0);
                double y = telemetry.get(i).getPosition().get(1);
                double alt = telemetry.get(i).getAltitude();
                obsY.add(x, y);
                obsAlt.add(x, alt);
            }
            PolynomialCurveFitter fitter = PolynomialCurveFitter.create(3);
            double[] coeffY = fitter.fit(obsY.toList());
            double[] coeffAlt = fitter.fit(obsAlt.toList());
            double minX = telemetry.get(0).getPosition().get(0);
            double maxX = telemetry.get(telemetry.size() - 1).getPosition().get(0);
            int N = 20;
            for (int i = 0; i < N; i++) {
                double xi = minX + (maxX - minX) * i / (N - 1);
                double yi = coeffY[0] + coeffY[1]*xi + coeffY[2]*xi*xi + coeffY[3]*xi*xi*xi;
                double alti = coeffAlt[0] + coeffAlt[1]*xi + coeffAlt[2]*xi*xi + coeffAlt[3]*xi*xi*xi;
                realContinuation.add(new PredictedPoint(
                    i + 1,
                    xi,
                    yi,
                    alti
                ));
            }
        } else if (telemetry.size() >= 2) {

            for (int i = 0; i < telemetry.size(); i++) {
                var point = telemetry.get(i);
                realContinuation.add(new PredictedPoint(
                        i + 1,
                        point.getPosition().get(0),
                        point.getPosition().get(1),
                        point.getAltitude()

                ));
            }
        }
        return new TrajectoryVisualizationResponse(
                droneRequest.getDrone_id(),
                currentTrajectory,
                forecast,
                realContinuation
        );
    }

    @NoArgsConstructor
    @Data
    public static class TrajectoryVisualizationResponse {
        private String droneId;
        private List<PredictedPoint> currentTrajectory;
        private List<PredictedPoint> forecast;
        private List<PredictedPoint> realContinuation;
        public TrajectoryVisualizationResponse(String droneId, List<PredictedPoint> currentTrajectory, List<PredictedPoint> forecast, List<PredictedPoint> realContinuation) {
            this.droneId = droneId;
            this.currentTrajectory = currentTrajectory;
            this.forecast = forecast;
            this.realContinuation = realContinuation;
        }
    }
}