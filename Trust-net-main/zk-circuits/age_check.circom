pragma circom 2.0.0;

// This template is required for the comparison logic
include "node_modules/circomlib/circuits/comparators.circom";

template AgeCheck(threshold) {
    signal input birthYear;      // Private input
    signal input currentYear;    // Public input
    signal output isAdult;       // 1 if true, 0 if false

    // Checks if (currentYear - birthYear) >= threshold
    component geq = GreaterEqThan(32); 
    
    geq.in[0] <== currentYear - birthYear;
    geq.in[1] <== threshold;

    isAdult <== geq.out;
}

// Sets 18 as the threshold for your identity platform
component main {public [currentYear]} = AgeCheck(18);

