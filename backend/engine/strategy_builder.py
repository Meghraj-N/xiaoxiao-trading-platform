import numpy as np

class StrategyBuilder:
    def __init__(self):
        pass

    def calculate_payoff_curve(self, legs, current_price, range_percent=0.2, steps=100):
        """
        Calculates the payoff curve for a multi-leg options strategy.
        legs: List of dicts: {'type': 'CALL'/'PUT', 'strike': float, 'premium': float, 'quantity': int, 'side': 'BUY'/'SELL'}
        """
        low_price = current_price * (1 - range_percent)
        high_price = current_price * (1 + range_percent)
        price_range = np.linspace(low_price, high_price, steps)

        payoff = np.zeros(steps)
        net_premium = 0.0
        combined_greeks = {"delta": 0, "gamma": 0, "theta": 0, "vega": 0}

        for leg in legs:
            strike = float(leg['strike'])
            premium = float(leg['premium'])
            qty = int(leg['quantity'])
            side_multiplier = 1 if leg['side'].upper() == 'BUY' else -1
            
            # Aggregate Greeks
            if 'greeks' in leg:
                combined_greeks['delta'] += leg['greeks'].get('delta', 0) * qty * side_multiplier
                combined_greeks['gamma'] += leg['greeks'].get('gamma', 0) * qty * side_multiplier
                combined_greeks['theta'] += leg['greeks'].get('theta', 0) * qty * side_multiplier
                combined_greeks['vega'] += leg['greeks'].get('vega', 0) * qty * side_multiplier

            # Cash flow from entering the trade
            leg_premium = premium * qty * side_multiplier
            net_premium -= leg_premium 

            if leg['type'].upper() == 'CALL':
                # Max(0, Price - Strike) - Premium
                intrinsic_value = np.maximum(0, price_range - strike)
            else:
                # Max(0, Strike - Price) - Premium
                intrinsic_value = np.maximum(0, strike - price_range)
            
            # PnL for this leg at expiration across all prices
            leg_pnl = (intrinsic_value - premium) * qty * side_multiplier
            payoff += leg_pnl

        # Calculate max profit and loss
        max_profit = float(np.max(payoff))
        max_loss = float(np.min(payoff))
        
        # Format the curve for LightweightCharts
        # For lightweight charts, we need x/y or time/value.
        # Since it's a price axis, we'll use price as 'time' (cast to integer if needed, or string).
        # Actually, LW Charts line series requires time to be a unix timestamp or business day string.
        # So we can't easily plot a payoff curve natively with lightweight-charts as an X/Y scatter plot where X is price.
        # LW Charts expects time on the X axis.
        # Wait, if we use a standard charting library (like Chart.js) it's easier, but we can fake it in LW Charts by making "time" equal to the price if we sort it.
        # However, LW Charts requires "time" to be strictly increasing, which price is.
        # We can map price to a fake timestamp, e.g., price * 1000.
        
        curve_data = []
        for i, price in enumerate(price_range):
            # Hack for LW Charts: use the integer price as fake timestamp.
            # E.g. $60000 -> 6000000000 unix stamp (long in the future, but renders linearly)
            # Better to just return price as 'x' and pnl as 'y', and handle it on frontend.
            curve_data.append({"price": float(price), "pnl": float(payoff[i])})

        return {
            "curve": curve_data,
            "max_profit": max_profit if max_profit < 999999 else "Unlimited",
            "max_loss": max_loss if max_loss > -999999 else "Unlimited",
            "net_premium": net_premium,
            "combined_greeks": combined_greeks
        }

strategy_builder = StrategyBuilder()
