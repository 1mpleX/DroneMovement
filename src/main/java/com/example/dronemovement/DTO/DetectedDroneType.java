package com.example.dronemovement.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class DetectedDroneType {
    private String droneId;
    private String droneType;

    public DetectedDroneType(String droneId, String droneType) {
        this.droneId = droneId;
        this.droneType = droneType;
    }
}
