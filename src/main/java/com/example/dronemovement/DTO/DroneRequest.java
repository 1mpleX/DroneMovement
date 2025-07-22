package com.example.dronemovement.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class DroneRequest {

    @JsonProperty("drone_id")
    private String drone_id;
    private String type;
    private List<TelemetryPoint> telemetry;

    private String method;
    @JsonProperty("points_limit")
    private Integer points_limit;

    @Data
    public static class TelemetryPoint {
        private int time;
        private List<Double> position;
        private double altitude;
    }
}
