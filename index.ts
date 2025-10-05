/**
 * @type ActionType
 * Tipo para las acciones.
 */
type ActionType = 'BUY' | 'SELL'

/**
 * @interface Stock
 * Define la estructura básica de una Acción.
 */
interface Stock {
    ticker: string; // símbolo bursatil (META, APPL)
    shares: number; // cantidad de acciones en posesión
    currentPrice(): number; // metodo que devuelve el ultimo precio disponible de la accion
    currentValue(): number
}

/**
 * @interface StockAllocation
 * Define la asignación objetivo deseada para un ticker específico.
 */
interface StockAllocation {
    ticker: string; 
    targetPercentage: number;  // Porcentaje objetivo del valor total de la cartera (0.0 a 1.0)
}

/**
 * @interface RebalanceAction
 * Define las acciones de compra o venta sugeridas por el reequilibrio.
 */
interface RebalanceAction {
    ticker: string;
    action: ActionType
    amount: number
}

// _____ IMPLEMENTACION DE INTERFACES Y CREACION DE CLASES _____

/**
 * @class SimpleStock
 * Una implementación concreta de la interfaz Stock para simulación.
 */
class SimpleStock implements Stock {

    ticker: string;
    shares: number;
    private price: number; // Precio actual que se almacena internamente para este ejemplo

    constructor(ticker: string, shares: number, price: number) {
        this.ticker = ticker;
        this.shares = shares;
        this.price = price
    }

    /**
    * Devuelve el último precio disponible para la acción.
    * @returns {number} El precio actual de la acción.
    */
    currentPrice(): number {
        return this.price;
    }

    /**
     * Calcula el valor total de las acciones poseídas.
     * @returns {number} Valor total ($) = shares * currentPrice.
     */
    currentValue(): number {
        return this.shares * this.price;
    }
    
}

/**
 * @class Portfolio
 * Representa la Cartera con su colección de Acciones y su asignación objetivo.
 */
class Portfolio {

    private holdings: Stock[]; // Colección de las acciones que la cartera posee actualmente.
    private allocations: StockAllocation[]; // Distribución objetivo de la cartera (ej: 0.4 para META, 0.6 para APPL).

    constructor(holdings: Stock[], allocations: StockAllocation[]) {
        this.holdings = holdings;
        this.allocations = allocations;

        // Validación simple para asegurar que las asignaciones sumen 100%
        const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.targetPercentage, 0);
        console.log("total allocation: ", totalAllocation);

        if (Math.abs(totalAllocation - 1.0) > 0.001) {            
            console.warn(`Precaución: El total de asignaciones es ${totalAllocation * 100}%, no 100%`);
        }
    }

    /**
     * Calcula el valor total de la cartera.
     * @returns {number} El valor total de todos los holdings.
     */
    private calculateTotalValue(): number {
        return this.holdings.reduce((total, stock) => total + stock.currentPrice() * stock.shares, 0);
    }

    /**
     * Calcula las acciones de compra/venta necesarias para reequilibrar la cartera
     * a su asignación objetivo.
     *
     * @returns {RebalanceAction[]} Una lista de acciones sugeridas (compra/venta y monto en $).
     */
    public rebalance(): RebalanceAction[] {
        const totalValue = this.calculateTotalValue();
        const rebalanceActions: RebalanceAction[] = [];

        // Primero se determina el valor objetivo y su valor actual de cada accion
        for (const allocation of this.allocations) {
            const ticker = allocation.ticker;
            const targetValue = totalValue * allocation.targetPercentage;

            // Encuentra la accion actual en holdings y si no existe se asume que se poseé 0 acciones
            const currentStock = this.holdings.find(s => s.ticker === ticker);
            const currentValue = currentStock ? currentStock.currentValue() : 0;

            // Calculamos la diferencia entre el valor objetivo y el actual bajo la logica de:
            // Diferencia > 0: Necesita comprar (valor objetivo es mayor que el actual)
            // Diferencia < 0: Necesita vender (valor actual es mayor que el objetivo)
            const difference = targetValue - currentValue;

            // Generamos la accion de reequilibrio si la diferencia es significativa 
            // Utilizando un pequeño umbral (0.01) para evitar acciones triviales
            if (currentStock && Math.abs(difference) > 0.01) {
                const action: ActionType = difference > 0 ? 'BUY' : 'SELL';
                
                const sharesToTransact = Math.abs(difference) / currentStock.currentPrice();

                rebalanceActions.push({
                    ticker,
                    action,
                    amount: sharesToTransact
                });
            }
        }
        // Finalmente devolvemos las acciones sugeridas para reequilibrar la cartera
        return rebalanceActions;
    }
}


// --- Ejemplo de Uso y Pruebas ---

// 1. Configuración de Acciones Actuales
const metaStock = new SimpleStock('META', 10, 300); // 10 acciones * $300 = $3,000
const applStock = new SimpleStock('APPL', 5, 200);  // 5 acciones * $200 = $1,000
const currentHoldings: Stock[] = [metaStock, applStock];

// Valor Total de la Cartera será: $3,000 + $1,000 = $4,000

// 2. Configuración de Asignación Objetivo
const targetAllocations: StockAllocation[] = [
    { ticker: 'META', targetPercentage: 0.40 }, // Objetivo: 40% de $4,000 = $1,600
    { ticker: 'APPL', targetPercentage: 0.60 }  // Objetivo: 60% de $4,000 = $2,400
];

// 3. Creacion del Portfolio(cartera) y recalibracion
const portfolio = new Portfolio(currentHoldings, targetAllocations);
const actions = portfolio.rebalance();

// 4. Mostramos resultados
console.log("=== Análisis de Reequilibrio de Cartera ===");
console.log(`Valor Actual de META: $${metaStock.currentValue().toFixed(2)}`);
console.log(`Valor Actual de APPL: $${applStock.currentValue().toFixed(2)}`);
console.log(`Valor Total de la Cartera: $${portfolio['calculateTotalValue']().toFixed(2)}`);
console.log("-----------------------------------------");
console.log("Acciones de Reequilibrio Sugeridas:");

if (actions.length === 0) {
    console.log("Cartera equilibrada dentro del umbral de tolerancia");
} else {
    actions.forEach(action => {
        // En un sistema real, aquí se calcularían las unidades enteras de acciones
        const currentStock = currentHoldings.find(s => s.ticker === action.ticker);
        const price = currentStock ? currentStock.currentPrice() : 0;
        const sharesToTransact = price > 0 ? (action.amount / price) : 0;

        console.log(
            `👉 ${action.action} ${action.amount.toFixed(2).padStart(8, ' ')}$ | ${action.ticker} ` +
            `(aprox. ${sharesToTransact.toFixed(2)} acciones)`
        );
    });
}