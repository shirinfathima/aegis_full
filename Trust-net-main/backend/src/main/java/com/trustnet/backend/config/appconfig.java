package com.trustnet.backend.config;

import org.springframework.beans.factory.annotation.Value; // Import Value
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.web3j.protocol.Web3j; 
import org.web3j.protocol.http.HttpService;

@Configuration
public class appconfig {

    // 1. Read the value from application.properties
    // If the property is missing, it defaults to the public Amoy URL
    @Value("${amoy.rpc-url:https://rpc-amoy.polygon.technology/}")
    private String amoyRpcUrl;

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    // 2. Use that value to build the Web3j service
    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(amoyRpcUrl));
    }
}