const n=`# Building a Neural Network from Scratch

## Published: May 30, 2025

![Neural Network Visualization](https://images.unsplash.com/photo-1545987796-200677ee1011?q=80&w=1000&auto=format&fit=crop)

In this project, I built a simple neural network from scratch using only NumPy. This helped me understand the fundamentals of deep learning without relying on high-level frameworks.

## The Architecture

I implemented a straightforward feed-forward neural network with configurable hidden layers. The network supports various activation functions and includes regularization options.

## Implementation

Here's the core implementation of the forward pass:

\`\`\`python
def forward(self, X):
    """
    Forward propagation through the network
    
    Args:
        X: Input data of shape (batch_size, input_dim)
        
    Returns:
        Output predictions and cached activations for backprop
    """
    cache = {}
    
    # Input layer to first hidden layer
    cache['Z1'] = np.dot(X, self.weights['W1']) + self.weights['b1']
    cache['A1'] = self.relu(cache['Z1'])
    
    # Hidden layers
    for i in range(2, self.num_layers):
        cache[f'Z{i}'] = np.dot(cache[f'A{i-1}'], self.weights[f'W{i}']) + self.weights[f'b{i}']
        cache[f'A{i}'] = self.relu(cache[f'Z{i}'])
    
    # Output layer
    cache[f'Z{self.num_layers}'] = np.dot(cache[f'A{self.num_layers-1}'], 
                                         self.weights[f'W{self.num_layers}']) + \\
                                  self.weights[f'b{self.num_layers}']
    
    # Softmax activation for classification
    cache[f'A{self.num_layers}'] = self.softmax(cache[f'Z{self.num_layers}'])
    
    return cache[f'A{self.num_layers}'], cache
\`\`\`

## Backpropagation

The backpropagation algorithm calculates gradients to update our weights:

\`\`\`python
def backward(self, X, y, cache):
    """
    Backward propagation to compute gradients
    
    Args:
        X: Input data
        y: Target labels
        cache: Cached values from forward pass
        
    Returns:
        Dictionary of gradients for each parameter
    """
    m = X.shape[0]
    grads = {}
    
    # Output layer gradient
    dZ = cache[f'A{self.num_layers}'] - y
    grads[f'W{self.num_layers}'] = (1/m) * np.dot(cache[f'A{self.num_layers-1}'].T, dZ)
    grads[f'b{self.num_layers}'] = (1/m) * np.sum(dZ, axis=0, keepdims=True)
    
    # Hidden layers gradient
    for i in range(self.num_layers-1, 0, -1):
        dA = np.dot(dZ, self.weights[f'W{i+1}'].T)
        dZ = dA * self.relu_derivative(cache[f'Z{i}'])
        
        if i == 1:
            # First hidden layer gets gradient from inputs
            grads[f'W{i}'] = (1/m) * np.dot(X.T, dZ)
        else:
            # Other hidden layers get gradient from previous layer
            grads[f'W{i}'] = (1/m) * np.dot(cache[f'A{i-1}'].T, dZ)
            
        grads[f'b{i}'] = (1/m) * np.sum(dZ, axis=0, keepdims=True)
    
    return grads
\`\`\`

## JavaScript Implementation

I also created a JavaScript version for web applications:

\`\`\`javascript
class NeuralNetwork {
  constructor(inputSize, hiddenLayers, outputSize) {
    this.layers = [inputSize, ...hiddenLayers, outputSize];
    this.weights = {};
    
    // Initialize weights with Xavier initialization
    for (let i = 0; i < this.layers.length - 1; i++) {
      const limit = Math.sqrt(6 / (this.layers[i] + this.layers[i + 1]));
      this.weights[\`W\${i+1}\`] = Array(this.layers[i])
        .fill()
        .map(() => Array(this.layers[i+1])
          .fill()
          .map(() => Math.random() * 2 * limit - limit));
      
      this.weights[\`b\${i+1}\`] = Array(this.layers[i+1]).fill(0);
    }
  }
  
  relu(x) {
    return x.map(v => Math.max(0, v));
  }
  
  forward(X) {
    const cache = {};
    
    cache.A0 = X;
    
    for (let i = 1; i <= this.layers.length - 1; i++) {
      cache[\`Z\${i}\`] = matrixMultiply(
        cache[\`A\${i-1}\`], 
        this.weights[\`W\${i}\`]
      ).map((row, rowIdx) => 
        row.map((val, colIdx) => val + this.weights[\`b\${i}\`][colIdx])
      );
      
      if (i === this.layers.length - 1) {
        cache[\`A\${i}\`] = this.softmax(cache[\`Z\${i}\`]);
      } else {
        cache[\`A\${i}\`] = this.relu(cache[\`Z\${i}\`]);
      }
    }
    
    return {
      output: cache[\`A\${this.layers.length - 1}\`],
      cache
    };
  }
}
\`\`\`

## Results

Training the network on the MNIST dataset yielded an accuracy of 97.2% on the test set. The following chart shows the loss decreasing over training epochs:

| Epoch | Train Loss | Test Accuracy |
|-------|------------|---------------|
| 1     | 0.562      | 85.4%         |
| 5     | 0.214      | 92.7%         |
| 10    | 0.128      | 95.1%         |
| 20    | 0.086      | 97.2%         |

## Conclusion

Building a neural network from scratch was an enlightening exercise. While frameworks like TensorFlow and PyTorch are more practical for real-world applications, implementing the fundamentals myself provided invaluable insights into how these frameworks operate under the hood.

The code is available on my [GitHub repository](https://github.com/example/neural-network-from-scratch).
`;export{n as default};
