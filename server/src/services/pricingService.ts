export interface PricingQuote {
  totalDays: number;
  dailyRate: number;
  weeklyRate: number;
  dailyRateApplied: number;
  rentalCostLkr: number;
  depositAmountLkr: number;
  totalAmountLkr: number;
  weeklyDiscountApplied: boolean;
  savingsLkr: number;
}

export function calculateRentalPrice(
  pickupDateStr: string,
  returnDateStr: string,
  dailyRate: number,
  weeklyRate: number,
  depositLkr: number
): PricingQuote {
  const pickup = new Date(pickupDateStr);
  const returnDate = new Date(returnDateStr);

  if (isNaN(pickup.getTime()) || isNaN(returnDate.getTime())) {
    throw new Error('Invalid date format provided.');
  }

  // Calculate difference in days
  const diffTime = returnDate.getTime() - pickup.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    throw new Error('Return date must be strictly after pickup date.');
  }

  let rentalCostLkr = 0;
  let weeklyDiscountApplied = false;
  let savingsLkr = 0;
  let dailyRateApplied = dailyRate;

  // If 7 days or more, calculate using weekly rate + remaining daily rates
  if (diffDays >= 7 && weeklyRate > 0) {
    const fullWeeks = Math.floor(diffDays / 7);
    const extraDays = diffDays % 7;
    const weeklyBasedCost = (fullWeeks * weeklyRate) + (extraDays * dailyRate);
    const regularDailyCost = diffDays * dailyRate;

    if (weeklyBasedCost < regularDailyCost) {
      rentalCostLkr = weeklyBasedCost;
      weeklyDiscountApplied = true;
      savingsLkr = regularDailyCost - weeklyBasedCost;
      dailyRateApplied = Math.round((rentalCostLkr / diffDays) * 100) / 100;
    } else {
      rentalCostLkr = regularDailyCost;
    }
  } else {
    rentalCostLkr = diffDays * dailyRate;
  }

  const depositAmountLkr = depositLkr;
  const totalAmountLkr = rentalCostLkr + depositAmountLkr;

  return {
    totalDays: diffDays,
    dailyRate,
    weeklyRate,
    dailyRateApplied,
    rentalCostLkr: Math.round(rentalCostLkr),
    depositAmountLkr: Math.round(depositAmountLkr),
    totalAmountLkr: Math.round(totalAmountLkr),
    weeklyDiscountApplied,
    savingsLkr: Math.round(savingsLkr)
  };
}
