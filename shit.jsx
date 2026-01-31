
              {cartItems.map((item, index) => (
                <>
                { item.category =  'Frame' ?
                <React.Fragment key={index}>
                  <div className="col-6 d-flex align-items-center mt-4 gap-3">
                    <img src={item.image} alt="" width={70} />
                    <div>
                      <p className="m-0 fw-bold">{item.name}</p>
                      <p className="m-0 text-muted" style={{ fontSize: 13 }}>
                        {item.category}
                        {item.size &&  • Size: ${item.size}}
                      </p>
                    </div>
                  </div>

                  <div className="col-2 mt-4 text-center">
                    {item.price} EGP
                  </div>

                  <div className="col-2 mt-4 text-center">
                    <button onClick={() => updateQty(item, -1)}>-</button>
                    <span className="mx-2">{item.quantity}</span>
                    <button onClick={() => updateQty(item, 1)}>+</button>
                  </div>

                  <div className="col-2 mt-4 text-end">
                    {item.price * item.quantity} EGP
                  </div>
                </React.Fragment>
                :<React.Fragment key={index}>
                  <div className="col-6 d-flex align-items-center mt-4 gap-3">
                    <img src={item.image} alt="" width={70} />
                    <div>
                      <p className="m-0 fw-bold">{item.name}</p>
                      <p className="m-0 text-muted" style={{ fontSize: 13 }}>
                        {item.category}
                        {item.size &&  • Size: ${item.size}}
                      </p>
                    </div>
                  </div>

                  <div className="col-2 mt-4 text-center">
                    {item.price} EGP
                  </div>

                  <div className="col-2 mt-4 text-center">
                    <button onClick={() => updateQty(item, -1)}>-</button>
                    <span className="mx-2">{item.quantity}</span>
                    <button onClick={() => updateQty(item, 1)}>+</button>
                  </div>

                  <div className="col-2 mt-4 text-end">
                    {item.price * item.quantity} EGP
                  </div>
                </React.Fragment>}
                </>
              ))}